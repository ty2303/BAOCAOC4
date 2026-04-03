var express = require("express");
var router = express.Router();
const ordersController = require("../controllers/orders.controller");
let { checkLogin, checkRole } = require('../utils/authHandler');

// tạo đơn hàng từ giỏ hàng
router.post("/", checkLogin, checkRole(['USER']), ordersController.createOrder);

module.exports = router;
