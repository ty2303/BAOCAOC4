var express = require('express');
var router = express.Router();
let couponModel = require('../schemas/coupons');
let { checkLogin, checkRole } = require('../utils/authHandler');

// GET / - lấy tất cả coupon (ADMIN)
router.get('/', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let result = await couponModel.find({ isDeleted: false });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET /:id - lấy 1 coupon theo id (ADMIN)
router.get('/:id', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let result = await couponModel.findOne({ _id: req.params.id, isDeleted: false });
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: 'ID không hợp lệ' });
    }
});

// POST / - tạo coupon mới (ADMIN)
router.post('/', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        if (!req.body.code) {
            return res.status(400).send({ message: 'Mã giảm giá là bắt buộc' });
        }
        let newCoupon = new couponModel(req.body);
        await newCoupon.save();
        res.send(newCoupon);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// PUT /:id - cập nhật coupon (ADMIN)
router.put('/:id', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let allowedFields = ['code', 'description', 'discount', 'discountType', 'minOrderValue', 'maxUses', 'startDate', 'endDate'];
        let updateData = {};
        for (let field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updateData[field] = req.body[field];
            }
        }

        let result = await couponModel.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            updateData,
            { returnDocument: 'after', runValidators: true }
        );
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// DELETE /:id - xóa coupon (soft delete) (ADMIN)
router.delete('/:id', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let result = await couponModel.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { isDeleted: true },
            { returnDocument: 'after' }
        );
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// PATCH /:id/toggle-active - bật/tắt coupon (ADMIN)
router.patch('/:id/toggle-active', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let coupon = await couponModel.findOne({ _id: req.params.id, isDeleted: false });
        if (!coupon) return res.status(404).send({ message: 'Không tìm thấy' });

        coupon.isActive = !coupon.isActive;
        await coupon.save();
        res.send(coupon);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// POST /validate - kiểm tra coupon có hợp lệ không (USER)
router.post('/validate', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let { code, orderValue } = req.body;

        if (!code) {
            return res.status(400).send({ message: 'Vui lòng nhập mã giảm giá' });
        }

        let coupon = await couponModel.findOne({
            code: code.trim().toUpperCase(),
            isDeleted: false
        });

        if (!coupon) {
            return res.status(400).send({ message: 'Mã giảm giá không tồn tại' });
        }

        if (!coupon.isActive) {
            return res.status(400).send({ message: 'Mã giảm giá đã bị vô hiệu hóa' });
        }

        let now = new Date();
        if (coupon.startDate && now < coupon.startDate) {
            return res.status(400).send({ message: 'Mã giảm giá chưa đến thời gian sử dụng' });
        }

        if (coupon.endDate && now > coupon.endDate) {
            return res.status(400).send({ message: 'Mã giảm giá đã hết hạn' });
        }

        if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
            return res.status(400).send({ message: 'Mã giảm giá đã hết lượt sử dụng' });
        }

        if (orderValue !== undefined && Number(orderValue) < coupon.minOrderValue) {
            return res.status(400).send({ message: 'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá' });
        }

        res.send(coupon);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
