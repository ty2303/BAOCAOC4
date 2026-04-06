var express = require("express");
var router = express.Router();
const { default: mongoose } = require("mongoose");
let orderModel = require("../schemas/order");
let transactionModel = require("../schemas/transactions");
let cartModel = require("../schemas/carts");
let inventoryModel = require("../schemas/inventories");
let addressModel = require("../schemas/addresses");
let couponModel = require("../schemas/coupons");
let { checkLogin, checkRole } = require("../utils/authHandler");

// POST / - tạo đơn hàng từ giỏ hàng
router.post("/", checkLogin, checkRole(["USER"]), async (req, res) => {
	let session = await mongoose.startSession();
	session.startTransaction();

	try {
		let userId = req.userId;
		let orderData = req.body;

		// Lấy giỏ hàng, populate để lấy price
		let cart = await cartModel
			.findOne({ user: userId })
			.session(session)
			.populate("items.product");

		if (!cart || cart.items.length === 0) {
			throw new Error("Giỏ hàng trống");
		}

		// Kiểm tra tồn kho + tính tổng tiền
		let totalAmount = 0;
		let orderItems = [];

		for (let item of cart.items) {
			if (!item.product) {
				throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
			}

			let inventory = await inventoryModel
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

		// Áp dụng mã giảm giá (nếu có)
		let couponCode = null;
		let discountAmount = 0;

		if (orderData.couponCode) {
			let coupon = await couponModel.findOne({
				code: orderData.couponCode.trim().toUpperCase(),
				isDeleted: false,
			});

			if (!coupon) throw new Error("Mã giảm giá không tồn tại");
			if (!coupon.isActive) throw new Error("Mã giảm giá đã bị vô hiệu hóa");

			let now = new Date();
			if (coupon.startDate && now < coupon.startDate) {
				throw new Error("Mã giảm giá chưa đến thời gian sử dụng");
			}
			if (coupon.endDate && now > coupon.endDate) {
				throw new Error("Mã giảm giá đã hết hạn");
			}
			if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
				throw new Error("Mã giảm giá đã hết lượt sử dụng");
			}
			if (totalAmount < coupon.minOrderValue) {
				throw new Error(
					"Đơn hàng tối thiểu " + coupon.minOrderValue + "đ để dùng mã này",
				);
			}

			// Tính số tiền giảm
			if (coupon.discountType === "PERCENT") {
				discountAmount = Math.round((totalAmount * coupon.discount) / 100);
			} else {
				discountAmount = coupon.discount;
			}

			// Không giảm quá tổng tiền
			if (discountAmount > totalAmount) {
				discountAmount = totalAmount;
			}

			totalAmount = totalAmount - discountAmount;
			couponCode = coupon.code;

			// Tăng lượt sử dụng
			await couponModel.findByIdAndUpdate(
				coupon._id,
				{ $inc: { usedCount: 1 } },
				{ session },
			);
		}
		// LOCK hàng (atomic) — chống oversale
		for (let item of orderItems) {
			let updatedInventory = await inventoryModel.findOneAndUpdate(
				{ product: item.productId, stock: { $gte: item.quantity } },
				{ $inc: { stock: -item.quantity, reserved: +item.quantity } },
				{ new: true, session },
			);

			if (!updatedInventory) {
				throw new Error("Sản phẩm không đủ hàng (đã có người mua trước)");
			}
		}

		// Tính địa chỉ giao hàng
		let shippingAddress = "";
		if (orderData.shippingAddress && orderData.shippingAddress.trim()) {
			shippingAddress = orderData.shippingAddress.trim();
		} else if (orderData.addressId) {
			let address = await addressModel.findOne({
				_id: orderData.addressId,
				user: userId,
				isDeleted: false,
			});
			if (!address) throw new Error("Khong tim thay dia chi");
			shippingAddress = [
				address.detail,
				address.ward,
				address.district,
				address.province,
			]
				.filter(Boolean)
				.join(", ");
		} else {
			let defaultAddress = await addressModel.findOne({
				user: userId,
				isDeleted: false,
				isDefault: true,
			});
			if (!defaultAddress) throw new Error("Ban chua co dia chi giao hang");
			shippingAddress = [
				defaultAddress.detail,
				defaultAddress.ward,
				defaultAddress.district,
				defaultAddress.province,
			]
				.filter(Boolean)
				.join(", ");
		}

		// Tạo order
		let newOrder = new orderModel({
			userId: userId,
			items: orderItems,
			totalAmount: totalAmount,
			couponCode: couponCode,
			discountAmount: discountAmount,
			shippingAddress: shippingAddress,
			paymentMethod: orderData.paymentMethod,
			status: "pending",
		});
		await newOrder.save({ session });

		// Tạo transaction
		let transaction = new transactionModel({
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
		res.send(newOrder);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		res.status(400).send({ message: error.message });
	}
});

module.exports = router;
