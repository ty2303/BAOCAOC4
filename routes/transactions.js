var express = require("express");
var router = express.Router();
const transactionsController = require("../controllers/transactions.controller");

// lịch sử giao dịch của user đang login
router.get("/", transactionsController.getByUser);

// giao dịch theo đơn hàng
router.get("/order/:orderId", transactionsController.getByOrder);

// chi tiết 1 giao dịch
router.get("/:id", transactionsController.getById);

// cập nhật trạng thái giao dịch
router.put("/:id/status", transactionsController.updateStatus);

// hoàn tiền
router.post("/order/:orderId/refund", transactionsController.createRefund);

module.exports = router;
