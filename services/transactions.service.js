const mongoose = require("mongoose");
const transactionModel = require("../schemas/transactions");
const orderModel = require("../schemas/order");
const inventoryModel = require("../schemas/inventories");

module.exports = {
	// lấy lịch sử giao dịch của 1 user
	getByUser: async (userId, query) => {
		const page = Number(query.page) || 1;
		const limit = Number(query.limit) || 10;
		const status = query.status;

		const filter = { userId: userId };
		if (status) {
			filter.status = status;
		}

		const transactions = await transactionModel
			.find(filter)
			.populate("orderId")
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit);

		return transactions;
	},

	// lấy giao dịch theo order
	getByOrder: async (orderId) => {
		return await transactionModel
			.find({ orderId: orderId })
			.sort({ createdAt: -1 });
	},

	// lấy chi tiết 1 giao dịch
	getById: async (transactionId) => {
		const transaction = await transactionModel
			.findById(transactionId)
			.populate("orderId")
			.populate("userId", "username email");
		if (!transaction) {
			return null;
		}
		return transaction;
	},

	// cập nhật trạng thái giao dịch (pending → success/failed)
	updateStatus: async (transactionId, newStatus) => {
		const transaction = await transactionModel.findById(transactionId);
		if (!transaction) {
			throw new Error("Không tìm thấy giao dịch");
		}
		if (transaction.status !== "pending") {
			throw new Error("Giao dịch đã hoàn tất, không thể thay đổi");
		}
		const result = await transactionModel.findByIdAndUpdate(
			transactionId,
			{ status: newStatus },
			{ new: true },
		);
		return result;
	},

	// tạo hoàn tiền (refund)
	createRefund: async (orderId, userId) => {
		const session = await mongoose.startSession();
		session.startTransaction();
		try {
			// tìm order (phải đúng user)
			const order = await orderModel.findOne({ _id: orderId, userId: userId });
			if (!order) {
				throw new Error("Không tìm thấy đơn hàng");
			}
			// chỉ refund khi pending hoặc processing
			if (!["pending", "processing"].includes(order.status)) {
				throw new Error(
					"Đơn hàng không thể hoàn tiền (trạng thái: " + order.status + ")",
				);
			}
			const existingRefund = await transactionModel.findOne({
				orderId: orderId,
				type: "refund",
			});
			if (existingRefund) {
				throw new Error("Đơn hàng này đã được hoàn tiền");
			}
			// hủy order
			order.status = "cancelled";
			await order.save({ session });
			// cộng lại tồn kho
			for (const item of order.items) {
				await inventoryModel.findOneAndUpdate(
					{ product: item.productId },
					{ $inc: { stock: +item.quantity, soldCount: -item.quantity } },
					{ session },
				);
			}
			// tạo transaction refund
			const refund = new transactionModel({
				orderId: orderId,
				userId: userId,
				amount: order.totalAmount,
				type: "refund",
				status: "success",
				paymentMethod: order.paymentMethod,
			});
			await refund.save({ session });
			// cập nhật payment gốc → failed
			await transactionModel.findOneAndUpdate(
				{ orderId: orderId, type: "payment" },
				{ status: "failed" },
				{ session },
			);
			await session.commitTransaction();
			session.endSession();
			return refund;
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			throw error;
		}
	},
};
