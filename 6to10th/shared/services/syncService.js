/* Background Internet Detector & Cloud Sync Service for Raspberry Pi */

const http = require('http');
const https = require('https');
const SyncQueueManager = require('./syncQueue');

class SyncService {
    constructor() {
        this.isOnline = false;
        this.syncInterval = null;
    }

    // Check internet connectivity by pinging reliable endpoint
    async checkInternetConnection() {
        return new Promise((resolve) => {
            const req = https.get('https://8.8.8.8', { timeout: 3000 }, (res) => {
                resolve(true);
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
        });
    }

    // Start background sync loop
    start(intervalMs = 15000) {
        console.log(`[SyncService] Starting background sync service (Interval: ${intervalMs}ms)...`);
        
        this.syncInterval = setInterval(async () => {
            const online = await this.checkInternetConnection();
            
            if (online && !this.isOnline) {
                console.log('🌐 [SyncService] Internet connection DETECTED! Triggering queue flush...');
            } else if (!online && this.isOnline) {
                console.log('📡 [SyncService] Internet connection LOST. Operating in local mode...');
            }
            
            this.isOnline = online;

            if (this.isOnline) {
                await this.processQueue();
            }
        }, intervalMs);
    }

    // Process pending items from local SQLite sync_queue to Cloud
    async processQueue() {
        const pendingItems = await SyncQueueManager.getPendingItems();
        if (!pendingItems.length) return;

        console.log(`[SyncService] Processing ${pendingItems.length} pending items for cloud sync...`);

        for (const item of pendingItems) {
            try {
                await SyncQueueManager.updateStatus(item.id, 'syncing');
                
                // Simulate cloud dispatch to Firebase Firestore / Cloud API
                const success = await this.dispatchToCloud(item);

                if (success) {
                    await SyncQueueManager.updateStatus(item.id, 'completed');
                    console.log(`✅ [SyncService] Successfully synced item #${item.id} (${item.entity}:${item.entity_id}) to Cloud.`);
                } else {
                    await SyncQueueManager.updateStatus(item.id, 'pending', true);
                }
            } catch (err) {
                console.error(`❌ [SyncService] Failed syncing item #${item.id}:`, err.message);
                await SyncQueueManager.updateStatus(item.id, 'pending', true);
            }
        }

        await SyncQueueManager.removeCompleted();
    }

    // Cloud Dispatcher for shared metrics (attendance, assignment status, progress, shared notes)
    async dispatchToCloud(item) {
        // Return true on successful simulated payload transmission
        return true;
    }

    stop() {
        if (this.syncInterval) clearInterval(this.syncInterval);
    }
}

module.exports = new SyncService();
