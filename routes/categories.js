var express = require('express');
var router = express.Router();
let categoryModel = require('../schemas/categories');
let { checkLogin, checkRole } = require('../utils/authHandler');

// GET / - lấy tất cả danh mục
router.get('/', async function (req, res) {
    try {
        let result = await categoryModel.find({ isDeleted: false });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET /:id - lấy 1 danh mục theo id
router.get('/:id', async function (req, res) {
    try {
        let result = await categoryModel.findOne({ _id: req.params.id, isDeleted: false });
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: 'ID không hợp lệ' });
    }
});

// POST / - tạo danh mục mới
router.post('/', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let newCategory = new categoryModel(req.body);
        await newCategory.save();
        res.send(newCategory);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// PUT /:id - cập nhật danh mục
router.put('/:id', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let result = await categoryModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// DELETE /:id - xóa danh mục (soft delete)
router.delete('/:id', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let result = await categoryModel.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
