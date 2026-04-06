var express = require('express');
var router = express.Router();
let mongoose = require('mongoose');
let orderModel = require('../schemas/order');
let transactionModel = require('../schemas/transactions');
let inventoryModel = require('../schemas/inventories');
let userModel = require('../schemas/users');
let { checkLogin, checkRole } = require('../utils/authHandler');

// PUT /:orderId/confirm - ADMIN xác nhận thanh toán (reserved → soldCount)
router.put('/:orderId/confirm', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    let session = await mongoose.startSession();
    session.startTransaction();

    try {
        let orderId = req.params.orderId;

        let order = await orderModel.findById(orderId).session(session);
        if (!order) throw new Error('Không tìm thấy đơn hàng');
        if (order.status !== 'pending') {
            throw new Error('Đơn hàng không thể xác nhận. Trạng thái hiện tại: ' + order.status);
        }

        let transaction = await transactionModel.findOne({ orderId: orderId, type: 'payment' }).session(session);
        if (!transaction) throw new Error('Không tìm thấy giao dịch thanh toán cho đơn hàng này');
        if (transaction.status !== 'pending') {
            throw new Error('Giao dịch đã được xử lý rồi (status: ' + transaction.status + ')');
        }

        // UNLOCK + COMMIT: reserved → soldCount
        for (let item of order.items) {
            let updated = await inventoryModel.findOneAndUpdate(
                { product: item.productId, reserved: { $gte: item.quantity } },
                { $inc: { reserved: -item.quantity, soldCount: +item.quantity } },
                { new: true, session }
            );
            if (!updated) throw new Error('Lỗi cập nhật tồn kho (reserved không đủ)');
        }

        order.status = 'processing';
        await order.save({ session });

        transaction.status = 'success';
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.send({ message: 'Xác nhận thanh toán thành công', order: order, transaction: transaction });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).send({ message: error.message });
    }
});

// PUT /:orderId/cancel - USER hoặc ADMIN hủy đơn chưa thanh toán (reserved → stock)
router.put('/:orderId/cancel', checkLogin, async function (req, res) {
    let session = await mongoose.startSession();
    session.startTransaction();

    try {
        let orderId = req.params.orderId;
        let userId = req.userId;

        // Kiểm tra quyền: user chỉ hủy được đơn của mình
        let currentUser = await userModel.findById(userId).populate('role');
        if (!currentUser) return res.status(403).send({ message: 'Không tìm thấy user' });

        if (currentUser.role.name !== 'ADMIN') {
            let order = await orderModel.findById(orderId);
            if (!order) return res.status(404).send({ message: 'Không tìm thấy đơn hàng' });
            if (order.userId.toString() !== userId) {
                return res.status(403).send({ message: 'Bạn không có quyền hủy đơn hàng này' });
            }
        }

        let order = await orderModel.findById(orderId).session(session);
        if (!order) throw new Error('Không tìm thấy đơn hàng');
        if (order.status !== 'pending') {
            throw new Error('Đơn hàng không thể hủy. Trạng thái hiện tại: ' + order.status);
        }

        let transaction = await transactionModel.findOne({ orderId: orderId, type: 'payment' }).session(session);
        if (!transaction) throw new Error('Không tìm thấy giao dịch thanh toán cho đơn hàng này');

        // UNLOCK + ROLLBACK: reserved → stock
        for (let item of order.items) {
            let updated = await inventoryModel.findOneAndUpdate(
                { product: item.productId, reserved: { $gte: item.quantity } },
                { $inc: { reserved: -item.quantity, stock: +item.quantity } },
                { new: true, session }
            );
            if (!updated) throw new Error('Lỗi cập nhật tồn kho khi hủy (reserved không đủ)');
        }

        order.status = 'cancelled';
        await order.save({ session });

        transaction.status = 'failed';
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.send({ message: 'Đã hủy đơn hàng và trả hàng về kho', order: order, transaction: transaction });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).send({ message: error.message });
    }
});

// POST /:orderId/pay-online - USER thanh toán online (momo/banking) — SIMULATE
router.post('/:orderId/pay-online', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let orderId = req.params.orderId;
        let userId = req.userId;
        let paymentDetails = req.body;

        let order = await orderModel.findById(orderId);
        if (!order) throw new Error('Không tìm thấy đơn hàng');
        if (order.userId.toString() !== userId) throw new Error('Bạn không có quyền thanh toán đơn hàng này');
        if (order.status !== 'pending') {
            throw new Error('Đơn hàng không thể thanh toán. Trạng thái hiện tại: ' + order.status);
        }
        if (!['banking', 'momo'].includes(order.paymentMethod)) {
            throw new Error('Đơn hàng dùng phương thức: ' + order.paymentMethod + '. Chỉ hỗ trợ thanh toán online cho banking và momo');
        }

        // Giả lập: có transactionCode = thành công
        let paymentSuccess = paymentDetails && paymentDetails.transactionCode;

        if (paymentSuccess) {
            // Xác nhận thanh toán: gọi thẳng logic confirm
            let session = await mongoose.startSession();
            session.startTransaction();
            try {
                let orderToConfirm = await orderModel.findById(orderId).session(session);
                let transaction = await transactionModel.findOne({ orderId: orderId, type: 'payment' }).session(session);

                for (let item of orderToConfirm.items) {
                    await inventoryModel.findOneAndUpdate(
                        { product: item.productId, reserved: { $gte: item.quantity } },
                        { $inc: { reserved: -item.quantity, soldCount: +item.quantity } },
                        { new: true, session }
                    );
                }

                orderToConfirm.status = 'processing';
                await orderToConfirm.save({ session });

                transaction.status = 'success';
                await transaction.save({ session });

                await session.commitTransaction();
                session.endSession();
                res.send({ message: 'Thanh toán online thành công', order: orderToConfirm, transaction: transaction, paymentDetails: paymentDetails });
            } catch (err) {
                await session.abortTransaction();
                session.endSession();
                throw err;
            }
        } else {
            // Hủy thanh toán: gọi thẳng logic cancel
            let session = await mongoose.startSession();
            session.startTransaction();
            try {
                let orderToCancel = await orderModel.findById(orderId).session(session);
                let transaction = await transactionModel.findOne({ orderId: orderId, type: 'payment' }).session(session);

                for (let item of orderToCancel.items) {
                    await inventoryModel.findOneAndUpdate(
                        { product: item.productId, reserved: { $gte: item.quantity } },
                        { $inc: { reserved: -item.quantity, stock: +item.quantity } },
                        { new: true, session }
                    );
                }

                orderToCancel.status = 'cancelled';
                await orderToCancel.save({ session });

                transaction.status = 'failed';
                await transaction.save({ session });

                await session.commitTransaction();
                session.endSession();
                res.send({ message: 'Thanh toán online thất bại. Đơn hàng đã hủy, hàng đã trả về kho', order: orderToCancel, transaction: transaction });
            } catch (err) {
                await session.abortTransaction();
                session.endSession();
                throw err;
            }
        }
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// GET /:orderId/status - USER/ADMIN xem trạng thái thanh toán
router.get('/:orderId/status', checkLogin, async function (req, res) {
    try {
        let orderId = req.params.orderId;
        let userId = req.userId;

        let currentUser = await userModel.findById(userId).populate('role');
        if (!currentUser) return res.status(403).send({ message: 'Không tìm thấy user' });

        let order = await orderModel.findById(orderId).populate('userId', 'username email');
        if (!order) throw new Error('Không tìm thấy đơn hàng');

        let transaction = await transactionModel.findOne({ orderId: orderId, type: 'payment' });

        let inventoryInfo = [];
        for (let item of order.items) {
            let inventory = await inventoryModel.findOne({ product: item.productId });
            inventoryInfo.push({
                productId: item.productId,
                quantity: item.quantity,
                currentStock: inventory ? inventory.stock : 0,
                currentReserved: inventory ? inventory.reserved : 0,
                currentSoldCount: inventory ? inventory.soldCount : 0
            });
        }

        if (currentUser.role.name !== 'ADMIN') {
            if (order.userId._id.toString() !== userId) {
                return res.status(403).send({ message: 'Bạn không có quyền xem đơn hàng này' });
            }
        }

        res.send({ order: order, transaction: transaction, inventory: inventoryInfo });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

module.exports = router;
