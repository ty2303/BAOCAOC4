let mongoose = require('mongoose');

// Schema cho từng item trong giỏ hàng
let itemCartSchema = mongoose.Schema({
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'product'
    },
    quantity: {
        type: Number,
        min: 1,
        default: 1
    }
}, { _id: false });  // không tạo _id cho từng item

// Schema cho giỏ hàng
let cartSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
        unique: true,   // 1 user chỉ có 1 cart
        required: true
    },
    items: {
        type: [itemCartSchema],
        default: []     // ban đầu giỏ hàng rỗng
    }
});

module.exports = mongoose.model('cart', cartSchema);
