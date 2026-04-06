var express = require('express');
var router = express.Router();
let roleModel = require('../schemas/roles');
let { checkLogin, checkRole } = require('../utils/authHandler');

// GET / - lấy tất cả roles (ADMIN)
router.get('/', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let result = await roleModel.find({ isDeleted: false });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET /:id - lấy 1 role theo id (ADMIN)
router.get('/:id', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let result = await roleModel.findOne({ _id: req.params.id, isDeleted: false });
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(404).send({ message: 'ID không hợp lệ' });
    }
});

// POST / - tạo role mới (ADMIN)
router.post('/', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let newRole = new roleModel(req.body);
        await newRole.save();
        res.send(newRole);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// PUT /:id - cập nhật role (ADMIN)
router.put('/:id', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let result = await roleModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// DELETE /:id - xóa role (soft delete) (ADMIN)
router.delete('/:id', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let result = await roleModel.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
