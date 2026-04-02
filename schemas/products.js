let mongoose = require('mongoose');


let productSchema = mongoose.Schema({
    title: { type: String, required: true, unique: true },

    // SKU = mã sản phẩm nội bộ, ví dụ: "SP001"
    sku: { type: String, required: true, unique: true },

    // slug = tiêu đề đã được chuẩn hóa dùng làm URL
    // ví dụ: "Áo Thun Nam" → "ao-thun-nam"
    slug: { type: String, required: true, unique: true },

    description: { type: String, default: "" },
    price: { type: Number, default: 0 },
    category: { type: String, required: true },
    images: { type: [String], default: [] },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('product', productSchema);