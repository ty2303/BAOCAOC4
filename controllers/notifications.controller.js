let notificationsService = require('../services/notifications.service');

module.exports = {
    getUnreadCount: async function (req, res) {
        try {
            let result = await notificationsService.countUnread(req.userId);
            res.send({ unreadCount: result });
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    getMyNotifications: async function (req, res) {
        try {
            let result = await notificationsService.getMyNotifications(req.userId);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    markAsRead: async function (req, res) {
        try {
            let result = await notificationsService.markAsRead(req.params.id, req.userId);
            if (!result) return res.status(404).send({ message: 'Khong tim thay thong bao' });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    markAllAsRead: async function (req, res) {
        try {
            let result = await notificationsService.markAllAsRead(req.userId);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    }
};
