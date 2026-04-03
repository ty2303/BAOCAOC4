let reviewModel = require('../schemas/reviews');
let productModel = require('../schemas/products');

module.exports = {
    getByProduct: async function (productId) {
        return await reviewModel.find({
            product: productId,
            isDeleted: false
        })
            .populate({
                path: 'user',
                select: 'username fullName'
            })
            .sort({ createdAt: -1 });
    },

    create: async function (userId, data) {
        let product = await productModel.findOne({
            _id: data.product,
            isDeleted: false
        });

        if (!product) {
            throw new Error('Khong tim thay san pham');
        }

        let newReview = new reviewModel({
            product: data.product,
            user: userId,
            rating: data.rating,
            comment: data.comment
        });

        await newReview.save();
        return newReview;
    },

    remove: async function (id) {
        return await reviewModel.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );
    }
};
