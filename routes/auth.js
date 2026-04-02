var express = require('express');
var router = express.Router();
let authController = require('../controllers/auth.controller');
let { checkLogin } = require('../utils/authHandler');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', checkLogin, authController.me);
router.post('/changepassword', checkLogin, authController.changePassword);
router.post('/forgotpassword', authController.forgotPassword);
router.post('/resetpassword/:token', authController.resetPassword);

module.exports = router;
