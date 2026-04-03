var express = require("express");
var router = express.Router();
const ordersController = require("../controllers/orders.controller");

// tạo đơn hàng từ giỏ hàng
router.post("/", ordersController.createOrder);

module.exports = router;
