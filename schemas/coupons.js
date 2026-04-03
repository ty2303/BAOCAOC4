let mongoose = require('mongoose');

let couponSchema = mongoose.Schema({
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, default: '' },
    discount: { type: Number, required: true, min: 0 },
    discountType: { type: String, enum: ['PERCENT', 'FIXED'], default: 'PERCENT' },
    minOrderValue: { type: Number, default: 0, min: 0 },
    maxUses: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

couponSchema.pre('validate', function () {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
        throw new Error('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
    }
});

module.exports = mongoose.model('coupon', couponSchema);
