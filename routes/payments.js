var express = require("express");
var router = express.Router();
const paymentsController = require("../controllers/payments.controller");
const { checkLogin, checkRole } = require("../utils/authHandler");

// Xác nhận thanh toán — chỉ ADMIN
router.put(
	"/:orderId/confirm",
	checkLogin,
	checkRole(["ADMIN"]),
	paymentsController.confirmPayment,
);

// Hủy thanh toán — USER hoặc ADMIN
router.put("/:orderId/cancel", checkLogin, paymentsController.cancelPayment);

// Thanh toán online — chỉ USER
router.post(
	"/:orderId/pay-online",
	checkLogin,
	checkRole(["USER"]),
	paymentsController.processOnlinePayment,
);

// Xem trạng thái thanh toán — USER hoặc ADMIN
router.get("/:orderId/status", checkLogin, paymentsController.getPaymentStatus);

module.exports = router;
