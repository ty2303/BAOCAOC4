var express = require('express');
var router = express.Router();
let mongoose = require('mongoose');
let wishlistModel = require('../schemas/wishlists');
let productModel = require('../schemas/products');
let { checkLogin, checkRole } = require('../utils/authHandler');

// GET / - lấy wishlist của user đang login
router.get('/', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let wishlist = await wishlistModel.findOneAndUpdate(
            { user: req.userId },
            { $setOnInsert: { user: req.userId } },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        res.send(wishlist.items);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// POST /add-items - thêm sản phẩm vào wishlist
router.post('/add-items', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let { product } = req.body;

        // Kiểm tra product hợp lệ
        if (!product) return res.status(400).send({ message: 'Product là bắt buộc' });
        if (!mongoose.Types.ObjectId.isValid(product)) return res.status(400).send({ message: 'Product không hợp lệ' });

        let foundProduct = await productModel.findOne({ _id: product, isDeleted: false });
        if (!foundProduct) return res.status(404).send({ message: 'Không tìm thấy sản phẩm' });

        let result = await wishlistModel.findOneAndUpdate(
            { user: req.userId },
            {
                $setOnInsert: { user: req.userId },
                $addToSet: { items: { product: new mongoose.Types.ObjectId(product) } }
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// POST /remove-items - xóa sản phẩm khỏi wishlist
router.post('/remove-items', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let { product } = req.body;

        // Kiểm tra product hợp lệ
        if (!product) return res.status(400).send({ message: 'Product là bắt buộc' });
        if (!mongoose.Types.ObjectId.isValid(product)) return res.status(400).send({ message: 'Product không hợp lệ' });

        let foundProduct = await productModel.findOne({ _id: product, isDeleted: false });
        if (!foundProduct) return res.status(404).send({ message: 'Không tìm thấy sản phẩm' });

        let result = await wishlistModel.findOneAndUpdate(
            { user: req.userId },
            {
                $setOnInsert: { user: req.userId },
                $pull: { items: { product: new mongoose.Types.ObjectId(product) } }
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
