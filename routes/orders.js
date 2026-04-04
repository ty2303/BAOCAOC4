var express = require("express");
var router = express.Router();
const ordersController = require("../controllers/orders.controller");
let { checkLogin, checkRole } = require('../utils/authHandler');

// tạo đơn hàng từ giỏ hàng
router.post("/", checkLogin, checkRole(['USER']), ordersController.createOrder);

// ADMIN: lấy tất cả đơn hàng
router.get("/", checkLogin, checkRole(['ADMIN']), ordersController.getAllOrders);

// ADMIN: cập nhật trạng thái đơn hàng (processing → shipped → delivered)
router.patch("/:orderId/status", checkLogin, checkRole(['ADMIN']), ordersController.updateOrderStatus);

module.exports = router;
