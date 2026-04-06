var express = require('express');
var router = express.Router();
let chatRoomModel = require('../schemas/chatRooms');
let messageModel = require('../schemas/messages');
let { checkLogin, checkRole } = require('../utils/authHandler');

// GET /my-messages - lấy tin nhắn của user đang login
router.get('/my-messages', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        // Tìm hoặc tạo phòng chat cho user
        let room = await chatRoomModel.findOne({ user: req.userId });
        if (!room) {
            room = new chatRoomModel({ user: req.userId });
            await room.save();
        }

        let messages = await messageModel.find({ room: room._id })
            .populate({ path: 'sender', select: 'username fullName role' })
            .sort({ createdAt: 1 });

        res.send(messages);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET /rooms - lấy tất cả phòng chat (ADMIN)
router.get('/rooms', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let result = await chatRoomModel.find()
            .populate({ path: 'user', select: 'username fullName email role' })
            .sort({ updatedAt: -1 });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET /messages/:userId - lấy tin nhắn của 1 user theo userId (ADMIN)
router.get('/messages/:userId', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let room = await chatRoomModel.findOne({ user: req.params.userId });
        if (!room) {
            room = new chatRoomModel({ user: req.params.userId });
            await room.save();
        }

        let messages = await messageModel.find({ room: room._id })
            .populate({ path: 'sender', select: 'username fullName role' })
            .sort({ createdAt: 1 });

        res.send(messages);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
