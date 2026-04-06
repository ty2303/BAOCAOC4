var express = require('express');
var router = express.Router();
let userModel = require('../schemas/users');
let { checkLogin, checkRole } = require('../utils/authHandler');

// GET / - lấy tất cả users (ADMIN)
router.get('/', checkLogin, checkRole(['ADMIN']), async function (req, res) {
    try {
        let result = await userModel.find({ isDeleted: false }).populate({ path: 'role', select: 'name' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET /:id - lấy 1 user theo id
router.get('/:id', checkLogin, async function (req, res) {
    try {
        let result = await userModel.findOne({ _id: req.params.id, isDeleted: false }).populate('role');
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(404).send({ message: 'ID không hợp lệ' });
    }
});

// POST / - tạo user mới
router.post('/', async function (req, res) {
    try {
        let newUser = new userModel(req.body);
        await newUser.save();
        res.send(newUser);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// PUT /:id - cập nhật user
router.put('/:id', checkLogin, async function (req, res) {
    try {
        let user = await userModel.findById(req.params.id);
        if (!user) return res.status(404).send({ message: 'Không tìm thấy' });

        for (let key of Object.keys(req.body)) {
            user[key] = req.body[key];
        }
        await user.save(); // dùng save() để trigger pre('save') hash password nếu đổi pass
        res.send(user);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// DELETE /:id - xóa user (soft delete)
router.delete('/:id', checkLogin, async function (req, res) {
    try {
        let result = await userModel.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
        if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
