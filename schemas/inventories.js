let mongoose = require('mongoose');

let inventorySchema = mongoose.Schema({
    // ref đến product — quan hệ 1-1
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'product',
        required: true,
        unique: true
    },
    stock: { type: Number, min: 0, default: 0 },      // tồn kho thực tế
    reserved: { type: Number, min: 0, default: 0 },   // đang được giữ chỗ
    soldCount: { type: Number, min: 0, default: 0 }   // đã bán
}, { timestamps: true });

module.exports = mongoose.model('inventory', inventorySchema);
