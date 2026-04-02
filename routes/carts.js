var express = require('express');
var router = express.Router();
let cartsController = require('../controllers/carts.controller');
let { checkLogin, checkRole } = require('../utils/authHandler');

// Chỉ USER mới được dùng cart, ADMIN bị chặn
router.get('/', checkLogin, checkRole(['USER']), cartsController.getCart);
router.post('/add-items', checkLogin, checkRole(['USER']), cartsController.addItems);
router.post('/decrease-items', checkLogin, checkRole(['USER']), cartsController.decreaseItems);

module.exports = router;
