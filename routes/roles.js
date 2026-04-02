var express = require('express');
var router = express.Router();
let roleModel = require('../schemas/roles');



router.get('/', async function (req, res, next) {
    let roles = await roleModel.find({ isDeleted: false });
    res.send(roles);
});
router.get('/:id', async function (req, res, next) {
    try {
        let result = await roleModel.findOne({ _id: req.params.id, isDeleted: false });
        if (!result) return res.status(404).send({ message: "Không tìm thấy" });
        res.send(result);
    } catch (error) {
        res.status(404).send({ message: "ID không hợp lệ" });
    }
});

// POST /api/v1/roles — Tạo role mới
router.post('/', async function (req, res, next) {
    try {
        let newRole = new roleModel({
            name: req.body.name,
            description: req.body.description
        });
        await newRole.save();
        res.send(newRole);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});


router.put('/:id', async function (req, res, next) {
    try {
        let updated = await roleModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updated) return res.status(404).send({ message: "Không tìm thấy" });
        res.send(updated);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});


router.delete('/:id', async function (req, res, next) {
    try {
        let updated = await roleModel.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true },
            { new: true }
        );
        if (!updated) return res.status(404).send({ message: "Không tìm thấy" });
        res.send(updated);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
