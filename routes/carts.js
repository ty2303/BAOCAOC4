var express = require('express');
var router = express.Router();
let cartsController = require('../controllers/carts.controller');
let { checkLogin } = require('../utils/authHandler');

// Tất cả cart routes đều cần đăng nhập
router.get('/', checkLogin, cartsController.getCart);
router.post('/add-items', checkLogin, cartsController.addItems);
router.post('/decrease-items', checkLogin, cartsController.decreaseItems);

module.exports = router;
