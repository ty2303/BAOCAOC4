var express = require("express");
var router = express.Router();
const transactionsController = require("../controllers/transactions.controller");
let { checkLogin, checkRole } = require('../utils/authHandler');

// lịch sử giao dịch của user đang login
router.get("/", checkLogin, checkRole(['USER']), transactionsController.getByUser);

// giao dịch theo đơn hàng
router.get("/order/:orderId", checkLogin, transactionsController.getByOrder);

// chi tiết 1 giao dịch
router.get("/:id", checkLogin, transactionsController.getById);

// cập nhật trạng thái giao dịch
router.put("/:id/status", checkLogin, checkRole(['ADMIN']), transactionsController.updateStatus);

// hoàn tiền
router.post("/order/:orderId/refund", checkLogin, checkRole(['USER']), transactionsController.createRefund);

module.exports = router;
