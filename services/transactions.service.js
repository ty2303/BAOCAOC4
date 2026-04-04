const mongoose = require("mongoose");
const transactionModel = require("../schemas/transactions");
const orderModel = require("../schemas/order");
const inventoryModel = require("../schemas/inventories");

module.exports = {
	// Lấy lịch sử giao dịch của 1 user
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

	// Lấy giao dịch theo order
	getByOrder: async (orderId) =>
		await transactionModel.find({ orderId: orderId }).sort({ createdAt: -1 }),

	// Lấy chi tiết 1 giao dịch
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

	// Cập nhật trạng thái giao dịch (pending → success/failed)
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

	// Hoàn tiền (refund) — chỉ áp dụng cho order đã thanh toán (processing)
	// Nếu order chưa thanh toán (pending) → dùng cancelPayment thay vì refund
	createRefund: async (orderId, userId) => {
		const session = await mongoose.startSession();
		session.startTransaction();
		try {
			const order = await orderModel.findOne({ _id: orderId, userId: userId });
			if (!order) {
				throw new Error("Không tìm thấy đơn hàng");
			}

			// Chỉ refund khi đã thanh toán (processing)
			// Nếu pending → dùng cancelPayment
			if (order.status === "pending") {
				throw new Error(
					"Đơn hàng chưa thanh toán. Hãy dùng hủy đơn thay vì hoàn tiền",
				);
			}
			if (order.status !== "processing") {
				throw new Error(
					"Đơn hàng không thể hoàn tiền (trạng thái: " + order.status + ")",
				);
			}

			const existingRefund = await transactionModel.findOne({
				orderId: orderId,
				type: "refund",
			});
			if (existingRefund) {
				throw new Error("Đơn hàng này đã được hoàn tiền rồi");
			}

			// Hủy order
			order.status = "cancelled";
			await order.save({ session });

			// Trả hàng về kho: soldCount -= qty, stock += qty
			for (const item of order.items) {
				await inventoryModel.findOneAndUpdate(
					{ product: item.productId },
					{ $inc: { stock: +item.quantity, soldCount: -item.quantity } },
					{ session },
				);
			}

			// Tạo transaction refund
			const refund = new transactionModel({
				orderId: orderId,
				userId: userId,
				amount: order.totalAmount,
				type: "refund",
				status: "success",
				paymentMethod: order.paymentMethod,
			});
			await refund.save({ session });

			// Cập nhật payment gốc → failed
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
