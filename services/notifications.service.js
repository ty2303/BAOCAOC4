let notificationModel = require('../schemas/notifications');

module.exports = {
    create: async function (data) {
        let newNotification = new notificationModel(data);
        await newNotification.save();
        return newNotification;
    },

    countUnread: async function (userId) {
        return await notificationModel.countDocuments({
            user: userId,
            isDeleted: false,
            isRead: false
        });
    },

    getMyNotifications: async function (userId) {
        return await notificationModel.find({
            user: userId,
            isDeleted: false
        }).sort({ createdAt: -1 });
    },

    markAsRead: async function (id, userId) {
        return await notificationModel.findOneAndUpdate(
            { _id: id, user: userId, isDeleted: false },
            { isRead: true },
            { new: true }
        );
    },

    markAllAsRead: async function (userId) {
        return await notificationModel.updateMany(
            { user: userId, isDeleted: false, isRead: false },
            { isRead: true }
        );
    }
};
