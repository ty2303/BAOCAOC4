const paymentsService = require("../services/payments.service");
const userModel = require("../schemas/users");
const orderModel = require("../schemas/order");

module.exports = {
	// PUT /api/v1/payments/:orderId/confirm — ADMIN xác nhận thanh toán
	confirmPayment: async (req, res) => {
		try {
			const orderId = req.params.orderId;
			const result = await paymentsService.confirmPayment(orderId);
			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	},

	// PUT /api/v1/payments/:orderId/cancel — USER/ADMIN hủy đơn chưa thanh toán
	cancelPayment: async (req, res) => {
		try {
			const orderId = req.params.orderId;
			const userId = req.userId;

			// Kiểm tra quyền: user chỉ hủy được đơn của mình
			const currentUser = await userModel.findById(userId).populate("role");
			if (!currentUser) {
				return res.status(403).send({ message: "Không tìm thấy user" });
			}

			if (currentUser.role.name !== "ADMIN") {
				const order = await orderModel.findById(orderId);
				if (!order) {
					return res.status(404).send({ message: "Không tìm thấy đơn hàng" });
				}
				if (order.userId.toString() !== userId) {
					return res
						.status(403)
						.send({ message: "Bạn không có quyền hủy đơn hàng này" });
				}
			}

			const result = await paymentsService.cancelPayment(orderId);
			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	},

	// POST /api/v1/payments/:orderId/pay-online — USER thanh toán online
	// Body: { "transactionCode": "MOMO123456", "bankName": "Vietcombank" }
	processOnlinePayment: async (req, res) => {
		try {
			const orderId = req.params.orderId;
			const userId = req.userId;
			const paymentDetails = req.body;

			const result = await paymentsService.processOnlinePayment(
				orderId,
				userId,
				paymentDetails,
			);
			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	},

	// GET /api/v1/payments/:orderId/status — USER/ADMIN xem trạng thái thanh toán
	getPaymentStatus: async (req, res) => {
		try {
			const orderId = req.params.orderId;
			const userId = req.userId;

			const currentUser = await userModel.findById(userId).populate("role");
			if (!currentUser) {
				return res.status(403).send({ message: "Không tìm thấy user" });
			}

			const result = await paymentsService.getPaymentStatus(orderId);

			if (currentUser.role.name !== "ADMIN") {
				if (result.order.userId._id.toString() !== userId) {
					return res
						.status(403)
						.send({ message: "Bạn không có quyền xem đơn hàng này" });
				}
			}

			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	},
};
