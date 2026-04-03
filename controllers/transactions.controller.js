const transactionsService = require("../services/transactions.service");

module.exports = {
	// lịch sử giao dịch của user đang login
	getByUser: async (req, res) => {
		try {
			const userId = req.user._id;
			const query = req.query;
			const result = await transactionsService.getByUser(userId, query);
			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	},

	// giao dịch của 1 đơn hàng
	getByOrder: async (req, res) => {
		try {
			const orderId = req.params.orderId;
			const result = await transactionsService.getByOrder(orderId);
			if (!result) {
				return res.status(404).send({ message: "Không tìm thấy giao dịch" });
			}
			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	},

	// chi tiết 1 giao dịch
	getById: async (req, res) => {
		try {
			const transactionId = req.params.id;
			const result = await transactionsService.getById(transactionId);
			if (!result) {
				return res.status(404).send({ message: "Không tìm thấy giao dịch" });
			}
			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	},

	// cập nhật trạng thái giao dịch
	updateStatus: async (req, res) => {
		try {
			const transactionId = req.params.id;
			const newStatus = req.body.status;
			const result = await transactionsService.updateStatus(
				transactionId,
				newStatus,
			);
			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	},

	// hoàn tiền
	createRefund: async (req, res) => {
		try {
			const orderId = req.params.orderId;
			const userId = req.user._id;
			const result = await transactionsService.createRefund(orderId, userId);
			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	},
};
