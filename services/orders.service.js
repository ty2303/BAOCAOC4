const mongoose = require("mongoose");
const orderModel = require("../schemas/order");
const transactionModel = require("../schemas/transactions");
const cartModel = require("../schemas/carts");
const inventoryModel = require("../schemas/inventories");

module.exports = {
	createOrder: async (userId, orderData) => {
		const session = await mongoose.startSession();
		session.startTransaction();
		try {
			// populate lấy price của product
			const cart = await cartModel
				.findOne({ user: userId })
				.populate("items.product");
			if (!cart || cart.items.length === 0) {
				throw new Error("Giỏ hàng trống");
			}
			// kiểm tra tồn kho và tính tổng
			let totalAmount = 0;
			const orderItems = [];
			for (const item of cart.items) {
				if (!item.product) {
					throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
				}
				const inventory = await inventoryModel.findOne({
					product: item.product._id,
				});
				if (!inventory || inventory.stock < item.quantity) {
					throw new Error("Sản phẩm không đủ hàng");
				}
				totalAmount += item.product.price * item.quantity;
				orderItems.push({
					productId: item.product._id,
					quantity: item.quantity,
					price: item.product.price,
				});
			}
			// tạo order
			const newOrder = new orderModel({
				userId: userId,
				items: orderItems,
				totalAmount: totalAmount,
				shippingAddress: orderData.shippingAddress,
				paymentMethod: orderData.paymentMethod,
				status: "pending",
			});
			await newOrder.save({ session });
			// trừ tồn kho
			for (const item of orderItems) {
				await inventoryModel.findOneAndUpdate(
					{ product: item.productId },
					{ $inc: { stock: -item.quantity, soldCount: item.quantity } },
					{ session },
				);
			}
			// tạo transaction record
			const transaction = new transactionModel({
				orderId: newOrder._id,
				userId: userId,
				amount: totalAmount,
				type: "payment",
				status: "pending",
				paymentMethod: orderData.paymentMethod,
			});
			await transaction.save({ session });
			// xóa giỏ hàng
			await cartModel.findOneAndUpdate(
				{ user: userId },
				{ $set: { items: [] } },
				{ session },
			);
			// commit
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
