const mongoose = require("mongoose");
const orderModel = require("../schemas/order");
const transactionModel = require("../schemas/transactions");
const cartModel = require("../schemas/carts");
const inventoryModel = require("../schemas/inventories");
const addressesService = require("./addresses.service");
const couponsService = require("./coupons.service");

// Các bước chuyển trạng thái hợp lệ
const ALLOWED_TRANSITIONS = {
	processing: ['shipped'],
	shipped: ['delivered']
};

module.exports = {
	createOrder: async (userId, orderData) => {
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			const cart = await cartModel
				.findOne({ user: userId })
				.session(session)
				.populate("items.product");

			if (!cart || cart.items.length === 0) {
				throw new Error("Gio hang trong");
			}

			let subtotalAmount = 0;
			const orderItems = [];

			for (const item of cart.items) {
				if (!item.product) {
					throw new Error("Khong tim thay san pham trong gio hang");
				}

				const inventory = await inventoryModel
					.findOne({ product: item.product._id })
					.session(session);

				if (!inventory || inventory.stock < item.quantity) {
					throw new Error(
						'San pham "' +
							item.product.title +
							'" khong du hang. Con lai: ' +
							(inventory ? inventory.stock : 0) +
							", can: " +
							item.quantity,
					);
				}

				subtotalAmount = subtotalAmount + item.product.price * item.quantity;
				orderItems.push({
					productId: item.product._id,
					quantity: item.quantity,
					price: item.product.price,
				});
			}

			let couponResult = null;
			let couponCode = orderData.couponCode ? String(orderData.couponCode).trim().toUpperCase() : "";
			let discountAmount = 0;

			if (couponCode) {
				couponResult = await couponsService.validateCoupon(couponCode, subtotalAmount);
				discountAmount = Number(couponResult.discountAmount || 0);
			}

			let totalAmount = Math.max(0, subtotalAmount - discountAmount);

			// Doan nay tuong duong if-else JS binh thuong:
			// neu stock >= so luong can mua thi tru stock va cong reserved.
			// Viet bang findOneAndUpdate de tranh 2 nguoi mua cung luc bi oversell.
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
					throw new Error("San pham khong du hang (da co nguoi mua truoc)");
				}
			}

			const shippingAddress = await addressesService.getOrderAddressText(
				userId,
				orderData,
			);

			const newOrder = new orderModel({
				userId: userId,
				items: orderItems,
				subtotalAmount: subtotalAmount,
				discountAmount: discountAmount,
				totalAmount: totalAmount,
				couponCode: couponResult ? couponResult.code : "",
				shippingAddress: shippingAddress,
				paymentMethod: orderData.paymentMethod,
				status: "pending",
			});
			await newOrder.save({ session });

			const transaction = new transactionModel({
				orderId: newOrder._id,
				userId: userId,
				amount: totalAmount,
				type: "payment",
				status: "pending",
				paymentMethod: orderData.paymentMethod,
			});
			await transaction.save({ session });

			if (couponResult && couponResult._id) {
				await couponsService.increaseUsedCount(couponResult._id, session);
			}

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

	getAllOrders: async (query) => {
		const page = Number(query.page) || 1;
		const limit = Number(query.limit) || 20;
		const filter = {};
		if (query.status) filter.status = query.status;
		if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;

		const orders = await orderModel
			.find(filter)
			.populate('userId', 'username fullName email')
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit);

		const total = await orderModel.countDocuments(filter);
		return { orders, total, page, limit };
	},

	updateOrderStatus: async (orderId, newStatus) => {
		const order = await orderModel.findById(orderId);
		if (!order) throw new Error('Khong tim thay don hang');

		const allowed = ALLOWED_TRANSITIONS[order.status];
		if (!allowed || !allowed.includes(newStatus)) {
			throw new Error('Khong the chuyen trang thai tu "' + order.status + '" sang "' + newStatus + '"');
		}

		order.status = newStatus;
		await order.save();
		return order;
	}
};
