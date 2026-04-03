const mongoose = require("mongoose");
const orderModel = require("../schemas/order");
const transactionModel = require("../schemas/transactions");
const cartModel = require("../schemas/carts");
const inventoryModel = require("../schemas/inventories");
const addressesService = require("./addresses.service");

module.exports = {
	createOrder: async (userId, orderData) => {
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			// Populate de lay price cua product trong gio hang
			const cart = await cartModel
				.findOne({ user: userId })
				.session(session)
				.populate("items.product");

			if (!cart || cart.items.length === 0) {
				throw new Error("Gio hang trong");
			}

			// Kiem tra ton kho va tinh tong tien
			let totalAmount = 0;
			const orderItems = [];

			for (const item of cart.items) {
				if (!item.product) {
					throw new Error("Khong tim thay san pham trong gio hang");
				}

				const inventory = await inventoryModel.findOne({
					product: item.product._id,
				}).session(session);

				if (!inventory || inventory.stock < item.quantity) {
					throw new Error("San pham khong du hang");
				}

				totalAmount += item.product.price * item.quantity;
				orderItems.push({
					productId: item.product._id,
					quantity: item.quantity,
					price: item.product.price,
				});
			}

			const shippingAddress = await addressesService.getOrderAddressText(userId, orderData);

			const newOrder = new orderModel({
				userId: userId,
				items: orderItems,
				totalAmount: totalAmount,
				shippingAddress: shippingAddress,
				paymentMethod: orderData.paymentMethod,
				status: "pending",
			});

			await newOrder.save({ session });

			// Tru ton kho theo kieu atomic de tranh oversell khi nhieu nguoi mua cung luc
			// Co the hieu gan giong if-else JS thuong:
			// if (inventory.stock >= item.quantity) {
			//     inventory.stock = inventory.stock - item.quantity;
			//     inventory.soldCount = inventory.soldCount + item.quantity;
			//     await inventory.save();
			// } else {
			//     throw new Error("San pham khong du hang");
			// }
			for (const item of orderItems) {
				const updatedInventory = await inventoryModel.findOneAndUpdate(
					{
						product: item.productId,
						stock: { $gte: item.quantity },
					},
					{ $inc: { stock: -item.quantity, soldCount: item.quantity } },
					{ new: true, session },
				);

				if (!updatedInventory) {
					throw new Error("San pham khong du hang");
				}
			}

			const transaction = new transactionModel({
				orderId: newOrder._id,
				userId: userId,
				amount: totalAmount,
				type: "payment",
				status: "pending",
				paymentMethod: orderData.paymentMethod,
			});

			await transaction.save({ session });

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
