var express = require('express');
var router = express.Router();
let inventoryModel = require('../schemas/inventories');

// GET / - lấy tất cả tồn kho
router.get('/', async function (req, res) {
    try {
        let result = await inventoryModel.find().populate({
            path: 'product',
            select: 'title price'
        });
        res.send(result);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// POST /increase-stock - nhập thêm hàng vào kho
router.post('/increase-stock', async function (req, res) {
    try {
        let { product, quantity } = req.body;
        let inventory = await inventoryModel.findOne({ product: product });
        if (!inventory) return res.status(404).send({ message: 'Không tìm thấy product' });

        inventory.stock += quantity;
        await inventory.save();
        res.send(inventory);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// POST /decrease-stock - xuất hàng khỏi kho
router.post('/decrease-stock', async function (req, res) {
    try {
        let { product, quantity } = req.body;
        let inventory = await inventoryModel.findOne({ product: product });
        if (!inventory) return res.status(404).send({ message: 'Không tìm thấy product' });

        if (inventory.stock < quantity) {
            return res.status(400).send({ message: 'Không đủ số lượng trong kho' });
        }

        inventory.stock -= quantity;
        await inventory.save();
        res.send(inventory);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
