const mongoose = require("mongoose");
const transactionModel = require("../schemas/transactions");
const orderModel = require("../schemas/order");
const inventoryModel = require("../schemas/inventories");
const couponModel = require("../schemas/coupons");

module.exports = {
    getByUser: async (userId, query) => {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const status = query.status;

        const filter = { userId: userId };
        if (status) {
            filter.status = status;
        }

        return await transactionModel
            .find(filter)
            .populate("orderId")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
    },

    getAllForAdmin: async (query) => {
        const limit = Math.min(Number(query.limit) || 50, 200);
        const filter = {};

        if (query.status) {
            filter.status = query.status;
        }

        if (query.type) {
            filter.type = query.type;
        }

        if (query.paymentMethod) {
            filter.paymentMethod = query.paymentMethod;
        }

        let transactions = await transactionModel
            .find(filter)
            .populate({
                path: "orderId",
                select: "status totalAmount couponCode shippingAddress createdAt"
            })
            .populate({
                path: "userId",
                select: "username fullName email"
            })
            .sort({ createdAt: -1 })
            .limit(limit);

        let keyword = String(query.keyword || "").trim().toLowerCase();
        if (!keyword) {
            return transactions;
        }

        return transactions.filter(function (item) {
            let orderId = item.orderId && item.orderId._id ? String(item.orderId._id) : "";
            let transactionId = item._id ? String(item._id) : "";
            let username = item.userId && item.userId.username ? item.userId.username.toLowerCase() : "";
            let fullName = item.userId && item.userId.fullName ? item.userId.fullName.toLowerCase() : "";
            let email = item.userId && item.userId.email ? item.userId.email.toLowerCase() : "";

            return (
                transactionId.toLowerCase().includes(keyword) ||
                orderId.toLowerCase().includes(keyword) ||
                username.includes(keyword) ||
                fullName.includes(keyword) ||
                email.includes(keyword)
            );
        });
    },

    getByOrder: async (orderId) => {
        return await transactionModel.find({ orderId: orderId }).sort({ createdAt: -1 });
    },

    getById: async (transactionId) => {
        const transaction = await transactionModel
            .findById(transactionId)
            .populate("orderId")
            .populate("userId", "username fullName email");

        if (!transaction) {
            return null;
        }

        return transaction;
    },

    updateStatus: async (transactionId, newStatus) => {
        if (!["success", "failed"].includes(newStatus)) {
            throw new Error("Trang thai khong hop le");
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const transaction = await transactionModel.findById(transactionId).session(session);
            if (!transaction) {
                throw new Error("Khong tim thay giao dich");
            }

            if (transaction.status !== "pending") {
                throw new Error("Giao dich da hoan tat, khong the thay doi");
            }

            const order = await orderModel.findById(transaction.orderId).session(session);
            if (!order) {
                throw new Error("Khong tim thay don hang");
            }

            transaction.status = newStatus;
            await transaction.save({ session });

            if (transaction.type === "payment") {
                if (newStatus === "success") {
                    order.status = "processing";

                    for (const item of order.items) {
                        await inventoryModel.findOneAndUpdate(
                            { product: item.productId },
                            { $inc: { reserved: -item.quantity, soldCount: item.quantity } },
                            { session }
                        );
                    }
                } else if (newStatus === "failed") {
                    order.status = "cancelled";

                    for (const item of order.items) {
                        await inventoryModel.findOneAndUpdate(
                            { product: item.productId },
                            { $inc: { stock: item.quantity, reserved: -item.quantity } },
                            { session }
                        );
                    }

                    if (order.couponCode) {
                        const coupon = await couponModel.findOne({ code: order.couponCode }).session(session);
                        if (coupon && coupon.usedCount > 0) {
                            coupon.usedCount = coupon.usedCount - 1;
                            await coupon.save({ session });
                        }
                    }
                }
            }

            await order.save({ session });
            await session.commitTransaction();
            session.endSession();

            return await this.getById(transactionId);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    },

    createRefund: async (orderId, userId) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const order = await orderModel.findOne({ _id: orderId, userId: userId }).session(session);
            if (!order) {
                throw new Error("Khong tim thay don hang");
            }

            if (order.status === "pending") {
                throw new Error("Don hang chua thanh toan. Hay huy don thay vi hoan tien");
            }

            if (order.status !== "processing") {
                throw new Error("Don hang khong the hoan tien (trang thai: " + order.status + ")");
            }

            const existingRefund = await transactionModel.findOne({
                orderId: orderId,
                type: "refund"
            }).session(session);

            if (existingRefund) {
                throw new Error("Don hang nay da duoc hoan tien roi");
            }

            order.status = "cancelled";
            await order.save({ session });

            for (const item of order.items) {
                await inventoryModel.findOneAndUpdate(
                    { product: item.productId },
                    { $inc: { stock: item.quantity, soldCount: -item.quantity } },
                    { session }
                );
            }

            const refund = new transactionModel({
                orderId: orderId,
                userId: userId,
                amount: order.totalAmount,
                type: "refund",
                status: "success",
                paymentMethod: order.paymentMethod
            });
            await refund.save({ session });

            await transactionModel.findOneAndUpdate(
                { orderId: orderId, type: "payment" },
                { status: "failed" },
                { session }
            );

            if (order.couponCode) {
                const coupon = await couponModel.findOne({ code: order.couponCode }).session(session);
                if (coupon && coupon.usedCount > 0) {
                    coupon.usedCount = coupon.usedCount - 1;
                    await coupon.save({ session });
                }
            }

            await session.commitTransaction();
            session.endSession();
            return refund;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
};
