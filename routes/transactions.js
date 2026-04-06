var express = require('express');
var router = express.Router();
let mongoose = require('mongoose');
let transactionModel = require('../schemas/transactions');
let orderModel = require('../schemas/order');
let inventoryModel = require('../schemas/inventories');
let userModel = require('../schemas/users');
let { checkLogin, checkRole } = require('../utils/authHandler');

// GET / - lịch sử giao dịch của user đang login
router.get('/', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 10;
        let status = req.query.status;

        let filter = { userId: req.userId };
        if (status) {
            filter.status = status;
        }

        let result = await transactionModel.find(filter)
            .populate('orderId')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET /order/:orderId - giao dịch của 1 đơn hàng
router.get('/order/:orderId', checkLogin, async function (req, res) {
    try {
        let currentUser = await userModel.findById(req.userId).populate('role');
        if (!currentUser) return res.status(403).send({ message: 'Không tìm thấy user' });

        let result = await transactionModel.find({ orderId: req.params.orderId }).sort({ createdAt: -1 });
        if (!result || result.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy giao dịch' });
        }

        if (currentUser.role.name !== 'ADMIN' && result[0].userId.toString() !== req.userId) {
            return res.status(403).send({ message: 'Bạn không có quyền truy cập' });
        }

        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET /:id - chi tiết 1 giao dịch
router.get('/:id', checkLogin, async function (req, res) {
    try {
        let currentUser = await userModel.findById(req.userId).populate('role');
        if (!currentUser) return res.status(403).send({ message: 'Không tìm thấy user' });

        let result = await transactionModel.findById(req.params.id)
            .populate('orderId')
            .populate('userId', 'username email');

        if (!result) return res.status(404).send({ message: 'Không tìm thấy giao dịch' });

        if (currentUser.role.name !== 'ADMIN' && result.userId._id.toString() !== req.userId) {
            return res.status(403).send({ message: 'Bạn không có quyền truy cập' });
        }

        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// PUT /:id/status - cập nhật trạng thái giao dịch (ADMIN)
router.put('/:id/status', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let transaction = await transactionModel.findById(req.params.id);
        if (!transaction) throw new Error('Không tìm thấy giao dịch');
        if (transaction.status !== 'pending') {
            throw new Error('Giao dịch đã hoàn tất, không thể thay đổi');
        }

        let result = await transactionModel.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// POST /order/:orderId/refund - hoàn tiền (USER)
router.post('/order/:orderId/refund', checkLogin, checkRole(['USER']), async function (req, res) {
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
        let orderId = req.params.orderId;
        let userId = req.userId;

        let order = await orderModel.findOne({ _id: orderId, userId: userId });
        if (!order) throw new Error('Không tìm thấy đơn hàng');

        // Chỉ refund khi đã thanh toán (processing)
        if (order.status === 'pending') {
            throw new Error('Đơn hàng chưa thanh toán. Hãy dùng hủy đơn thay vì hoàn tiền');
        }
        if (order.status !== 'processing') {
            throw new Error('Đơn hàng không thể hoàn tiền (trạng thái: ' + order.status + ')');
        }

        let existingRefund = await transactionModel.findOne({ orderId: orderId, type: 'refund' });
        if (existingRefund) throw new Error('Đơn hàng này đã được hoàn tiền rồi');

        // Hủy order
        order.status = 'cancelled';
        await order.save({ session });

        // Trả hàng về kho: soldCount -= qty, stock += qty
        for (let item of order.items) {
            await inventoryModel.findOneAndUpdate(
                { product: item.productId },
                { $inc: { stock: +item.quantity, soldCount: -item.quantity } },
                { session }
            );
        }

        // Tạo transaction refund
        let refund = new transactionModel({
            orderId: orderId,
            userId: userId,
            amount: order.totalAmount,
            type: 'refund',
            status: 'success',
            paymentMethod: order.paymentMethod
        });
        await refund.save({ session });

        // Cập nhật payment gốc → failed
        await transactionModel.findOneAndUpdate(
            { orderId: orderId, type: 'payment' },
            { status: 'failed' },
            { session }
        );

        await session.commitTransaction();
        session.endSession();
        res.send(refund);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
