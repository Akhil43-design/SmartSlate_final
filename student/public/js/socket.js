/* Socket.IO Real-time Manager for Student Website */

const SocketManager = {
    socket: null,
    listeners: {},

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
            console.log('Student Socket connected:', this.socket.id);
        });

        this.socket.on('message:received', (msg) => {
            this._emit('message', msg);
        });

        this.socket.on('notification:push', (notif) => {
            this._emit('notification', notif);
            if (window.App && window.App.onNotificationReceived) {
                window.App.onNotificationReceived(notif);
            }
        });

        this.socket.on('new_assignment', (assignment) => {
            this._emit('new_assignment', assignment);
            if (window.App && window.App.onAssignmentReceived) {
                window.App.onAssignmentReceived(assignment);
            }
        });

        this.socket.on('connect_error', (err) => {
            console.warn('Socket connection error:', err.message);
        });
    },

    _emit(event, data) {
        const handlers = this.listeners[event];
        if (Array.isArray(handlers)) {
            handlers.forEach(fn => { try { fn(data); } catch(e) { console.error(e); } });
        } else if (typeof handlers === 'function') {
            try { handlers(data); } catch(e) { console.error(e); }
        }
    },

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
    }
};
