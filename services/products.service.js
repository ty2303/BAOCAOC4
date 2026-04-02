let productModel = require('../schemas/products');
let inventoryModel = require('../schemas/inventories');
let mongoose = require('mongoose');
let slugify = require('slugify');


module.exports = {
    getAll: async function (query) {
        // Lọc theo query params: title, minPrice, maxPrice, page, limit
        let { title = '', minPrice = 0, maxPrice = 1e9, page = 1, limit = 5 } = query;

        let result = await productModel.find({
            isDeleted: false,
            price: { $gte: Number(minPrice), $lte: Number(maxPrice) },
            title: { $regex: title, $options: 'i' } // tìm kiếm không phân biệt hoa thường
        })
            .skip((page - 1) * limit)  // bỏ qua N bản ghi đầu (phân trang)
            .limit(Number(limit));     // giới hạn số bản ghi trả về

        return result;
    },

    getById: async function (id) {
        return await productModel.findOne({ _id: id, isDeleted: false });
    },

    create: async function (data) {
        // Dùng session để đảm bảo tạo product và inventory cùng lúc
        // Nếu 1 cái lỗi → rollback cả 2 (Transaction)
        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            let newProduct = new productModel({
                title: data.title,
                sku: data.sku,
                slug: slugify(data.title, { locale: 'vi', trim: true }),
                description: data.description,
                price: data.price,
                category: data.category,
                images: data.images
            });
            await newProduct.save({ session });

            // Tạo inventory tương ứng với stock ban đầu
            let newInventory = new inventoryModel({
                product: newProduct._id,
                stock: data.stock || 0
            });
            await newInventory.save({ session });

            await session.commitTransaction();  // xác nhận lưu cả 2
            session.endSession();
            return newProduct;
        } catch (error) {
            await session.abortTransaction();   // hủy cả 2 nếu lỗi
            session.endSession();
            throw error;
        }
    },

    update: async function (id, data) {
        return await productModel.findByIdAndUpdate(id, data, { new: true });
    },

    remove: async function (id) {
        return await productModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }
}