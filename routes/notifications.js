var express = require('express');
var router = express.Router();
let notificationModel = require('../schemas/notifications');
let { checkLogin } = require('../utils/authHandler');

// GET / - lấy tất cả thông báo của user đang login
router.get('/', checkLogin, async function (req, res) {
    try {
        let result = await notificationModel.find({
            user: req.userId,
            isDeleted: false
        }).sort({ createdAt: -1 });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// PATCH /:id/read - đánh dấu 1 thông báo là đã đọc
router.patch('/:id/read', checkLogin, async function (req, res) {
    try {
        let result = await notificationModel.findOneAndUpdate(
            { _id: req.params.id, user: req.userId, isDeleted: false },
            { isRead: true },
            { new: true }
        );
        if (!result) return res.status(404).send({ message: 'Khong tim thay thong bao' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// PATCH /read-all - đánh dấu tất cả thông báo là đã đọc
router.patch('/read-all', checkLogin, async function (req, res) {
    try {
        let result = await notificationModel.updateMany(
            { user: req.userId, isDeleted: false, isRead: false },
            { isRead: true }
        );
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
