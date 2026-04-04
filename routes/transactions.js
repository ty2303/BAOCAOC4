var express = require("express");
var router = express.Router();
const transactionsController = require("../controllers/transactions.controller");
let { checkLogin, checkRole } = require("../utils/authHandler");

router.get("/", checkLogin, checkRole(["USER"]), transactionsController.getByUser);
router.get("/admin/all", checkLogin, checkRole(["ADMIN"]), transactionsController.getAllForAdmin);
router.get("/order/:orderId", checkLogin, transactionsController.getByOrder);
router.get("/:id", checkLogin, transactionsController.getById);
router.put("/:id/status", checkLogin, checkRole(["ADMIN"]), transactionsController.updateStatus);
router.post("/order/:orderId/refund", checkLogin, checkRole(["USER"]), transactionsController.createRefund);

module.exports = router;
