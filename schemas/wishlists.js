let mongoose = require('mongoose');

let itemWishlistSchema = mongoose.Schema({
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'product'
    }
}, { _id: false });

let wishlistSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
        unique: true,
        required: true
    },
    items: {
        type: [itemWishlistSchema],
        default: []
    }
});

module.exports = mongoose.model('wishlist', wishlistSchema);
