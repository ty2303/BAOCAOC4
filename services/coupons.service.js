let couponModel = require('../schemas/coupons');

function pickAllowedUpdateData(data) {
    let allowedFields = [
        'code',
        'description',
        'discount',
        'discountType',
        'minOrderValue',
        'maxUses',
        'startDate',
        'endDate'
    ];

    let result = {};
    for (let field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            result[field] = data[field];
        }
    }

    return result;
}

module.exports = {
    getAll: async function () {
        return await couponModel.find({ isDeleted: false });
    },

    getById: async function (id) {
        return await couponModel.findOne({ _id: id, isDeleted: false });
    },

    create: async function (data) {
        if (!data.code) {
            throw new Error('Mã giảm giá là bắt buộc');
        }

        let newCoupon = new couponModel(data);
        await newCoupon.save();
        return newCoupon;
    },

    update: async function (id, data) {
        let updateData = pickAllowedUpdateData(data);

        return await couponModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            updateData,
            { returnDocument: 'after', runValidators: true }
        );
    },

    remove: async function (id) {
        return await couponModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { isDeleted: true },
            { returnDocument: 'after' }
        );
    },

    toggleActive: async function (id) {
        let coupon = await couponModel.findOne({ _id: id, isDeleted: false });
        if (!coupon) return null;

        coupon.isActive = !coupon.isActive;
        await coupon.save();
        return coupon;
    },

    validateCoupon: async function (code, orderValue) {
        if (!code) {
            throw new Error('Vui lòng nhập mã giảm giá');
        }

        let coupon = await couponModel.findOne({
            code: code.trim().toUpperCase(),
            isDeleted: false
        });

        if (!coupon) {
            throw new Error('Mã giảm giá không tồn tại');
        }

        if (!coupon.isActive) {
            throw new Error('Mã giảm giá đã bị vô hiệu hóa');
        }

        let now = new Date();
        if (coupon.startDate && now < coupon.startDate) {
            throw new Error('Mã giảm giá chưa đến thời gian sử dụng');
        }

        if (coupon.endDate && now > coupon.endDate) {
            throw new Error('Mã giảm giá đã hết hạn');
        }

        if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
            throw new Error('Mã giảm giá đã hết lượt sử dụng');
        }

        if (orderValue !== undefined && Number(orderValue) < coupon.minOrderValue) {
            throw new Error('Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá');
        }

        return coupon;
    }
}
