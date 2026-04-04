var express = require('express');
var router = express.Router();
let notificationsController = require('../controllers/notifications.controller');
let { checkLogin } = require('../utils/authHandler');

router.get('/unread-count', checkLogin, notificationsController.getUnreadCount);
router.get('/', checkLogin, notificationsController.getMyNotifications);
router.patch('/:id/read', checkLogin, notificationsController.markAsRead);
router.patch('/read-all', checkLogin, notificationsController.markAllAsRead);

module.exports = router;
