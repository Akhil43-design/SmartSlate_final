/* Socket.IO Real-time Manager — SmartSlate */

const SocketManager = {
    socket: null,
    listeners: {}, // supports arrays for multi-listener per event

    init() {
        const token = API.getToken();
        if (!token) return;

        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io({
            auth: { token },
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
        });

        // Server emits 'message:received' for group & direct messages
        this.socket.on('message:received', (msg) => {
            this._emit('message', msg);
        });

        // Server emits 'notification:push'
        this.socket.on('notification:push', (notif) => {
            this._emit('notification', notif);
            if (window.App && window.App.onNotificationReceived) {
                window.App.onNotificationReceived(notif);
            }
        });

        // Parent unsafe search alert
        this.socket.on('parent:unsafe_search', (data) => {
            this._emit('parent:unsafe_search', data);
        });

        this.socket.on('connect_error', (err) => {
            console.warn('Socket connection error:', err.message);
        });
    },

    // Internal: emit to all registered listeners for an event
    _emit(event, data) {
        const handlers = this.listeners[event];
        if (Array.isArray(handlers)) {
            handlers.forEach(fn => { try { fn(data); } catch(e) { console.error(e); } });
        } else if (typeof handlers === 'function') {
            try { handlers(data); } catch(e) { console.error(e); }
        }
    },

    // Register a listener (appends to array, supports many listeners per event)
    on(event, handler) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        if (Array.isArray(this.listeners[event])) {
            this.listeners[event].push(handler);
        } else {
            this.listeners[event] = [this.listeners[event], handler];
        }
    },

    // Remove a specific handler (or all) for an event
    off(event, handler) {
        if (!handler) {
            delete this.listeners[event];
        } else if (Array.isArray(this.listeners[event])) {
            this.listeners[event] = this.listeners[event].filter(fn => fn !== handler);
        }
    },

    joinGroup(groupId) {
        if (this.socket) {
            this.socket.emit('chat:join', groupId);
        }
    },

    sendGroupMessage(groupId, content) {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error('Socket not connected'));
            this.socket.emit('message:send_group', { groupId, content }, (res) => {
                if (res && res.success) resolve(res.message);
                else reject(new Error(res ? res.error : 'Failed to send message'));
            });
        });
    },

    sendDirectMessage(receiverId, content) {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error('Socket not connected'));
            this.socket.emit('message:send_direct', { receiverId, content }, (res) => {
                if (res && res.success) resolve(res.message);
                else reject(new Error(res ? res.error : 'Failed to send message'));
            });
        });
    }
};
