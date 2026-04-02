let inventoriesService = require('../services/inventories.service');

module.exports = {
    getAll: async function (req, res) {
        try {
            let result = await inventoriesService.getAll();
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    increaseStock: async function (req, res) {
        try {
            // Lấy product id và số lượng từ body
            let { product, quantity } = req.body;
            let result = await inventoriesService.increaseStock(product, quantity);
            if (!result) return res.status(404).send({ message: 'Không tìm thấy product' });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    decreaseStock: async function (req, res) {
        try {
            let { product, quantity } = req.body;
            let result = await inventoriesService.decreaseStock(product, quantity);
            if (!result) return res.status(404).send({ message: 'Không tìm thấy product' });
            res.send(result);
        } catch (err) {
            // Lỗi "Không đủ số lượng" cũng bắt ở đây
            res.status(400).send({ message: err.message });
        }
    }
}
