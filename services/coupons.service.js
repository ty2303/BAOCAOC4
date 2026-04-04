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

function calculateDiscountAmount(coupon, orderValue) {
    let amount = 0;
    let numericOrderValue = Number(orderValue) || 0;

    if (coupon.discountType === 'PERCENT') {
        amount = numericOrderValue * Number(coupon.discount || 0) / 100;
    } else {
        amount = Number(coupon.discount || 0);
    }

    if (amount < 0) amount = 0;
    if (amount > numericOrderValue) amount = numericOrderValue;

    return Math.round(amount);
}

module.exports = {
    calculateDiscountAmount: calculateDiscountAmount,

    getAll: async function () {
        return await couponModel.find({ isDeleted: false });
    },

    getById: async function (id) {
        return await couponModel.findOne({ _id: id, isDeleted: false });
    },

    create: async function (data) {
        if (!data.code) {
            throw new Error('Ma giam gia la bat buoc');
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
            throw new Error('Vui long nhap ma giam gia');
        }

        let coupon = await couponModel.findOne({
            code: code.trim().toUpperCase(),
            isDeleted: false
        });

        if (!coupon) {
            throw new Error('Ma giam gia khong ton tai');
        }

        if (!coupon.isActive) {
            throw new Error('Ma giam gia da bi vo hieu hoa');
        }

        let now = new Date();
        if (coupon.startDate && now < coupon.startDate) {
            throw new Error('Ma giam gia chua den thoi gian su dung');
        }

        if (coupon.endDate && now > coupon.endDate) {
            throw new Error('Ma giam gia da het han');
        }

        if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
            throw new Error('Ma giam gia da het luot su dung');
        }

        if (orderValue !== undefined && Number(orderValue) < coupon.minOrderValue) {
            throw new Error('Don hang chua dat gia tri toi thieu de ap dung ma giam gia');
        }

        let discountAmount = calculateDiscountAmount(coupon, orderValue);

        return {
            _id: coupon._id,
            code: coupon.code,
            description: coupon.description,
            discount: coupon.discount,
            discountType: coupon.discountType,
            minOrderValue: coupon.minOrderValue,
            discountAmount: discountAmount,
            finalAmount: Math.max(0, Number(orderValue || 0) - discountAmount)
        };
    },

    increaseUsedCount: async function (couponId, session) {
        return await couponModel.findByIdAndUpdate(
            couponId,
            { $inc: { usedCount: 1 } },
            { new: true, session: session }
        );
    },

    decreaseUsedCount: async function (couponId, session) {
        return await couponModel.findOneAndUpdate(
            { _id: couponId, usedCount: { $gt: 0 } },
            { $inc: { usedCount: -1 } },
            { new: true, session: session }
        );
    }
};
