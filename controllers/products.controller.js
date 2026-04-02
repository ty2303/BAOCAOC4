let productsService = require('../services/products.service');

module.exports = {
    getAll: async function (req, res) {
        try {
            let result = await productsService.getAll(req.query);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    getById: async function (req, res) {
        try {
            let result = await productsService.getById(req.params.id);
            if (!result) return res.status(404).send({ message: "Không tìm thấy" });
            res.send(result);
        } catch (err) {
            res.status(404).send({ message: "ID không hợp lệ" });
        }
    },

    create: async function (req, res) {
        try {
            let result = await productsService.create(req.body);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    update: async function (req, res) {
        try {
            let result = await productsService.update(req.params.id, req.body);
            if (!result) return res.status(404).send({ message: "Không tìm thấy" });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    remove: async function (req, res) {
        try {
            let result = await productsService.remove(req.params.id);
            if (!result) return res.status(404).send({ message: "Không tìm thấy" });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    }
}
