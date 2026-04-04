const mongoose = require("mongoose");
const orderModel = require("../schemas/order");
const transactionModel = require("../schemas/transactions");
const inventoryModel = require("../schemas/inventories");
const couponModel = require("../schemas/coupons");

// LOCK / UNLOCK flow:
// - Đặt hàng: stock -= qty, reserved += qty (LOCK)
// - Thanh toán OK: reserved -= qty, soldCount += qty (UNLOCK + COMMIT)
// - Hủy/thất bại: reserved -= qty, stock += qty (UNLOCK + ROLLBACK)

module.exports = {
	// Xác nhận thanh toán — UNLOCK + COMMIT (reserved → soldCount)
	confirmPayment: async (orderId) => {
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			const order = await orderModel.findById(orderId).session(session);
			if (!order) {
				throw new Error("Không tìm thấy đơn hàng");
			}
			if (order.status !== "pending") {
				throw new Error(
					"Đơn hàng không thể xác nhận. Trạng thái hiện tại: " + order.status,
				);
			}

			const transaction = await transactionModel
				.findOne({
					orderId: orderId,
					type: "payment",
				})
				.session(session);
			if (!transaction) {
				throw new Error("Không tìm thấy giao dịch thanh toán cho đơn hàng này");
			}
			if (transaction.status !== "pending") {
				throw new Error(
					"Giao dịch đã được xử lý rồi (status: " + transaction.status + ")",
				);
			}

			// UNLOCK + COMMIT: reserved → soldCount
			for (const item of order.items) {
				const updated = await inventoryModel.findOneAndUpdate(
					{
						product: item.productId,
						reserved: { $gte: item.quantity },
					},
					{
						$inc: {
							reserved: -item.quantity,
							soldCount: +item.quantity,
						},
					},
					{ new: true, session },
				);
				if (!updated) {
					throw new Error("Lỗi cập nhật tồn kho (reserved không đủ)");
				}
			}

			order.status = "processing";
			await order.save({ session });

			transaction.status = "success";
			await transaction.save({ session });

			await session.commitTransaction();
			session.endSession();

			return {
				message: "Xác nhận thanh toán thành công",
				order: order,
				transaction: transaction,
			};
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			throw error;
		}
	},

	// Hủy thanh toán — UNLOCK + ROLLBACK (reserved → stock)
	cancelPayment: async (orderId) => {
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			const order = await orderModel.findById(orderId).session(session);
			if (!order) {
				throw new Error("Không tìm thấy đơn hàng");
			}
			if (order.status !== "pending") {
				throw new Error(
					"Đơn hàng không thể hủy. Trạng thái hiện tại: " + order.status,
				);
			}

			const transaction = await transactionModel
				.findOne({
					orderId: orderId,
					type: "payment",
				})
				.session(session);
			if (!transaction) {
				throw new Error("Không tìm thấy giao dịch thanh toán cho đơn hàng này");
			}

			// UNLOCK + ROLLBACK: reserved → stock
			for (const item of order.items) {
				const updated = await inventoryModel.findOneAndUpdate(
					{
						product: item.productId,
						reserved: { $gte: item.quantity },
					},
					{
						$inc: {
							reserved: -item.quantity,
							stock: +item.quantity,
						},
					},
					{ new: true, session },
				);
				if (!updated) {
					throw new Error("Lỗi cập nhật tồn kho khi hủy (reserved không đủ)");
				}
			}

			order.status = "cancelled";
			await order.save({ session });

			transaction.status = "failed";
			await transaction.save({ session });

			// Hoàn lại slot coupon nếu đơn có dùng coupon
			if (order.couponCode) {
				await couponModel.findOneAndUpdate(
					{ code: order.couponCode, usedCount: { $gt: 0 } },
					{ $inc: { usedCount: -1 } },
					{ session }
				);
			}

			await session.commitTransaction();
			session.endSession();

			return {
				message: "Đã hủy đơn hàng và trả hàng về kho",
				order: order,
				transaction: transaction,
			};
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			throw error;
		}
	},

	// Thanh toán online (momo/banking) — SIMULATE
	// Thực tế sẽ gọi API Momo/VNPay, ở đây giả lập:
	//   có transactionCode → thành công, không có → thất bại
	processOnlinePayment: async (orderId, userId, paymentDetails) => {
		const order = await orderModel.findById(orderId);
		if (!order) {
			throw new Error("Không tìm thấy đơn hàng");
		}
		if (order.userId.toString() !== userId) {
			throw new Error("Bạn không có quyền thanh toán đơn hàng này");
		}
		if (order.status !== "pending") {
			throw new Error(
				"Đơn hàng không thể thanh toán. Trạng thái hiện tại: " + order.status,
			);
		}
		if (!["banking", "momo"].includes(order.paymentMethod)) {
			throw new Error(
				"Đơn hàng dùng phương thức: " +
					order.paymentMethod +
					". " +
					"Chỉ hỗ trợ thanh toán online cho banking và momo",
			);
		}

		// Giả lập: có transactionCode = thành công
		const paymentSuccess = paymentDetails && paymentDetails.transactionCode;

		if (paymentSuccess) {
			const result = await module.exports.confirmPayment(orderId);
			result.message = "Thanh toán online thành công";
			result.paymentDetails = paymentDetails;
			return result;
		} else {
			const result = await module.exports.cancelPayment(orderId);
			result.message =
				"Thanh toán online thất bại. Đơn hàng đã hủy, hàng đã trả về kho";
			return result;
		}
	},

	// Xem trạng thái thanh toán
	getPaymentStatus: async (orderId) => {
		const order = await orderModel
			.findById(orderId)
			.populate("userId", "username email");
		if (!order) {
			throw new Error("Không tìm thấy đơn hàng");
		}

		const transaction = await transactionModel.findOne({
			orderId: orderId,
			type: "payment",
		});

		const inventoryInfo = [];
		for (const item of order.items) {
			const inventory = await inventoryModel.findOne({
				product: item.productId,
			});
			inventoryInfo.push({
				productId: item.productId,
				quantity: item.quantity,
				currentStock: inventory ? inventory.stock : 0,
				currentReserved: inventory ? inventory.reserved : 0,
				currentSoldCount: inventory ? inventory.soldCount : 0,
			});
		}

		return {
			order: order,
			transaction: transaction,
			inventory: inventoryInfo,
		};
	},
};
