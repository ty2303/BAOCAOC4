var express = require('express');
var router = express.Router();
let chatsController = require('../controllers/chats.controller');
let { checkLogin, checkRole } = require('../utils/authHandler');

router.get('/my-messages', checkLogin, checkRole(['USER']), chatsController.getMyMessages);

router.get('/rooms', checkLogin, checkRole(['ADMIN']), chatsController.getAllRooms);
router.get('/messages/:userId', checkLogin, checkRole(['ADMIN']), chatsController.getMessagesByUserId);

module.exports = router;
