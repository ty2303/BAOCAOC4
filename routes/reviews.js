var express = require('express');
var router = express.Router();
let reviewModel = require('../schemas/reviews');
let productModel = require('../schemas/products');
let { checkLogin, checkRole } = require('../utils/authHandler');

// GET /product/:productId - lấy tất cả review của 1 sản phẩm
router.get('/product/:productId', async function (req, res) {
    try {
        let result = await reviewModel.find({
            product: req.params.productId,
            isDeleted: false
        })
            .populate({ path: 'user', select: 'username fullName' })
            .sort({ createdAt: -1 });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// POST / - tạo review mới (USER)
router.post('/', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let product = await productModel.findOne({ _id: req.body.product, isDeleted: false });
        if (!product) return res.status(404).send({ message: 'Khong tim thay san pham' });

        let newReview = new reviewModel({
            product: req.body.product,
            user: req.userId,
            rating: req.body.rating,
            comment: req.body.comment
        });
        await newReview.save();
        res.send(newReview);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).send({ message: 'Ban da danh gia san pham nay roi' });
        }
        res.status(400).send({ message: err.message });
    }
});

// DELETE /:id - xóa review (ADMIN)
router.delete('/:id', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let result = await reviewModel.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
        if (!result) return res.status(404).send({ message: 'Khong tim thay review' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
