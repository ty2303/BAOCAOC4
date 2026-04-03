let mongoose = require('mongoose');
let wishlistModel = require('../schemas/wishlists');
let productModel = require('../schemas/products');

async function ensureValidProduct(product) {
    if (!product) {
        throw new Error('Product là bắt buộc');
    }

    if (!mongoose.Types.ObjectId.isValid(product)) {
        throw new Error('Product không hợp lệ');
    }

    let foundProduct = await productModel.findOne({ _id: product, isDeleted: false });
    if (!foundProduct) {
        throw new Error('Không tìm thấy sản phẩm');
    }
}

module.exports = {
    getWishlist: async function (userId) {
        let wishlist = await wishlistModel.findOneAndUpdate(
            { user: userId },
            { $setOnInsert: { user: userId } },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        return wishlist.items;
    },

    addItems: async function (userId, product) {
        await ensureValidProduct(product);

        return await wishlistModel.findOneAndUpdate(
            { user: userId },
            {
                $setOnInsert: { user: userId },
                $addToSet: { items: { product: new mongoose.Types.ObjectId(product) } }
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
    },

    removeItems: async function (userId, product) {
        await ensureValidProduct(product);

        return await wishlistModel.findOneAndUpdate(
            { user: userId },
            {
                $setOnInsert: { user: userId },
                $pull: { items: { product: new mongoose.Types.ObjectId(product) } }
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
    }
}
