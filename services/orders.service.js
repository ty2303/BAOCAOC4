const mongoose = require("mongoose");
const orderModel = require("../schemas/order");
const transactionModel = require("../schemas/transactions");
const cartModel = require("../schemas/carts");
const inventoryModel = require("../schemas/inventories");
const addressesService = require("./addresses.service");

module.exports = {
	// Tạo đơn hàng + LOCK hàng trong kho (chuyển stock → reserved)
	// Hàng chưa bán, chỉ giữ chỗ. Chờ thanh toán xong mới chuyển sang soldCount.
	createOrder: async (userId, orderData) => {
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			// Lấy giỏ hàng, populate để lấy price
			const cart = await cartModel
				.findOne({ user: userId })
				.session(session)
				.populate("items.product");

			if (!cart || cart.items.length === 0) {
				throw new Error("Giỏ hàng trống");
			}

			// Kiểm tra tồn kho + tính tổng tiền
			let totalAmount = 0;
			const orderItems = [];

			for (const item of cart.items) {
				if (!item.product) {
					throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
				}

				const inventory = await inventoryModel
					.findOne({ product: item.product._id })
					.session(session);

				if (!inventory || inventory.stock < item.quantity) {
					throw new Error(
						'Sản phẩm "' +
							item.product.title +
							'" không đủ hàng. ' +
							"Còn lại: " +
							(inventory ? inventory.stock : 0) +
							", cần: " +
							item.quantity,
					);
				}

				totalAmount = totalAmount + item.product.price * item.quantity;
				orderItems.push({
					productId: item.product._id,
					quantity: item.quantity,
					price: item.product.price,
				});
			}

			// LOCK hàng (atomic) — chống oversale
			// Dùng findOneAndUpdate + $gte để kiểm tra + trừ cùng lúc
			// stock -= qty (trừ khỏi kho), reserved += qty (giữ chỗ)
			for (const item of orderItems) {
				const updatedInventory = await inventoryModel.findOneAndUpdate(
					{
						product: item.productId,
						stock: { $gte: item.quantity },
					},
					{
						$inc: {
							stock: -item.quantity,
							reserved: +item.quantity,
						},
					},
					{ new: true, session },
				);

				if (!updatedInventory) {
					throw new Error("Sản phẩm không đủ hàng (đã có người mua trước)");
				}
			}

			// Tạo order
			const shippingAddress = await addressesService.getOrderAddressText(
				userId,
				orderData,
			);

			const newOrder = new orderModel({
				userId: userId,
				items: orderItems,
				totalAmount: totalAmount,
				shippingAddress: shippingAddress,
				paymentMethod: orderData.paymentMethod,
				status: "pending",
			});
			await newOrder.save({ session });

			// Tạo transaction
			const transaction = new transactionModel({
				orderId: newOrder._id,
				userId: userId,
				amount: totalAmount,
				type: "payment",
				status: "pending",
				paymentMethod: orderData.paymentMethod,
			});
			await transaction.save({ session });

			// Xóa giỏ hàng
			await cartModel.findOneAndUpdate(
				{ user: userId },
				{ $set: { items: [] } },
				{ session },
			);

			await session.commitTransaction();
			session.endSession();
			return newOrder;
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			throw error;
		}
	},
};
