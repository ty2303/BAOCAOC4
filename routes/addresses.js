var express = require('express');
var router = express.Router();
let addressModel = require('../schemas/addresses');
let { checkLogin, checkRole } = require('../utils/authHandler');

// GET / - lấy tất cả địa chỉ của user đang login
router.get('/', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let result = await addressModel.find({
            user: req.userId,
            isDeleted: false
        }).sort({ isDefault: -1, updatedAt: -1 });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET /:id - lấy 1 địa chỉ theo id
router.get('/:id', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let result = await addressModel.findOne({
            _id: req.params.id,
            user: req.userId,
            isDeleted: false
        });
        if (!result) return res.status(404).send({ message: 'Khong tim thay dia chi' });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// POST / - tạo địa chỉ mới
router.post('/', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let count = await addressModel.countDocuments({
            user: req.userId,
            isDeleted: false
        });

        if (req.body.isDefault) {
            await addressModel.updateMany(
                { user: req.userId, isDeleted: false },
                { isDefault: false }
            );
        }

        let newAddress = new addressModel({
            user: req.userId,
            fullName: req.body.fullName,
            phone: req.body.phone,
            province: req.body.province,
            district: req.body.district,
            ward: req.body.ward,
            detail: req.body.detail,
            isDefault: count === 0 ? true : !!req.body.isDefault
        });

        await newAddress.save();
        res.send(newAddress);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// PUT /:id - cập nhật địa chỉ
router.put('/:id', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let address = await addressModel.findOne({
            _id: req.params.id,
            user: req.userId,
            isDeleted: false
        });

        if (!address) return res.status(404).send({ message: 'Khong tim thay dia chi' });

        if (req.body.isDefault) {
            await addressModel.updateMany(
                { user: req.userId, isDeleted: false },
                { isDefault: false }
            );
        }

        address.fullName = req.body.fullName ?? address.fullName;
        address.phone = req.body.phone ?? address.phone;
        address.province = req.body.province ?? address.province;
        address.district = req.body.district ?? address.district;
        address.ward = req.body.ward ?? address.ward;
        address.detail = req.body.detail ?? address.detail;
        if (typeof req.body.isDefault === 'boolean') {
            address.isDefault = req.body.isDefault;
        }

        await address.save();
        res.send(address);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// DELETE /:id - xóa địa chỉ (soft delete)
router.delete('/:id', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let address = await addressModel.findOneAndUpdate(
            { _id: req.params.id, user: req.userId, isDeleted: false },
            { isDeleted: true, isDefault: false },
            { new: true }
        );

        if (!address) return res.status(404).send({ message: 'Khong tim thay dia chi' });

        // Nếu xóa xong không còn địa chỉ mặc định, tự động set địa chỉ mới nhất làm mặc định
        let defaultAddress = await addressModel.findOne({
            user: req.userId,
            isDeleted: false,
            isDefault: true
        });

        if (!defaultAddress) {
            let newestAddress = await addressModel.findOne({
                user: req.userId,
                isDeleted: false
            }).sort({ updatedAt: -1 });

            if (newestAddress) {
                newestAddress.isDefault = true;
                await newestAddress.save();
            }
        }

        res.send(address);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// PATCH /:id/default - đặt làm địa chỉ mặc định
router.patch('/:id/default', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let address = await addressModel.findOne({
            _id: req.params.id,
            user: req.userId,
            isDeleted: false
        });

        if (!address) return res.status(404).send({ message: 'Khong tim thay dia chi' });

        await addressModel.updateMany(
            { user: req.userId, isDeleted: false },
            { isDefault: false }
        );

        address.isDefault = true;
        await address.save();
        res.send(address);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
