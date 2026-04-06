var express = require('express');
var router = express.Router();
let productModel = require('../schemas/products');
let inventoryModel = require('../schemas/inventories');
const { default: mongoose } = require('mongoose');
let slugify = require('slugify');

// GET / - lấy tất cả sản phẩm, có filter theo query params
// ?title=áo&minPrice=100&maxPrice=500&page=1&limit=5
router.get('/', async function (req, res) {
    try {
        let { title = '', minPrice = 0, maxPrice = 1e9, page = 1, limit = 5 } = req.query;

        let result = await productModel.find({
            isDeleted: false,
            price: { $gte: Number(minPrice), $lte: Number(maxPrice) },
            title: { $regex: title, $options: 'i' }
        })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET /:id - lấy 1 sản phẩm theo id
router.get('/:id', async function (req, res) {
    try {
        let result = await productModel.findOne({ _id: req.params.id, isDeleted: false });
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(404).send({ message: 'ID không hợp lệ' });
    }
});

// POST / - tạo sản phẩm mới + inventory
router.post('/', async function (req, res) {
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
        let data = req.body;

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

        await session.commitTransaction();
        session.endSession();
        res.send(newProduct);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).send({ message: err.message });
    }
});

// PUT /:id - cập nhật sản phẩm
router.put('/:id', async function (req, res) {
    try {
        let result = await productModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// DELETE /:id - xóa sản phẩm (soft delete)
router.delete('/:id', async function (req, res) {
    try {
        let result = await productModel.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
