const transactionsService = require("../services/transactions.service");
let userModel = require('../schemas/users');

module.exports = {
	// lịch sử giao dịch của user đang login
	getByUser: async (req, res) => {
		try {
			const userId = req.userId;
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
			const currentUser = await userModel.findById(req.userId).populate('role');
			if (!currentUser) {
				return res.status(403).send({ message: "Không tìm thấy user" });
			}
			const result = await transactionsService.getByOrder(orderId);
			if (!result || result.length === 0) {
				return res.status(404).send({ message: "Không tìm thấy giao dịch" });
			}
			if (
				currentUser.role.name !== 'ADMIN' &&
				result[0].userId.toString() !== req.userId
			) {
				return res.status(403).send({ message: "Bạn không có quyền truy cập" });
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
			const currentUser = await userModel.findById(req.userId).populate('role');
			if (!currentUser) {
				return res.status(403).send({ message: "Không tìm thấy user" });
			}
			const result = await transactionsService.getById(transactionId);
			if (!result) {
				return res.status(404).send({ message: "Không tìm thấy giao dịch" });
			}
			if (
				currentUser.role.name !== 'ADMIN' &&
				result.userId._id.toString() !== req.userId
			) {
				return res.status(403).send({ message: "Bạn không có quyền truy cập" });
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
			const userId = req.userId;
			const result = await transactionsService.createRefund(orderId, userId);
			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	},
};
