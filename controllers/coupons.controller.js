let couponsService = require('../services/coupons.service');

module.exports = {
    getAll: async function (req, res) {
        try {
            let result = await couponsService.getAll();
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    getById: async function (req, res) {
        try {
            let result = await couponsService.getById(req.params.id);
            if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: 'ID không hợp lệ' });
        }
    },

    create: async function (req, res) {
        try {
            let result = await couponsService.create(req.body);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    update: async function (req, res) {
        try {
            let result = await couponsService.update(req.params.id, req.body);
            if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    remove: async function (req, res) {
        try {
            let result = await couponsService.remove(req.params.id);
            if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    toggleActive: async function (req, res) {
        try {
            let result = await couponsService.toggleActive(req.params.id);
            if (!result) return res.status(404).send({ message: 'Không tìm thấy' });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    validateCoupon: async function (req, res) {
        try {
            let { code, orderValue } = req.body;
            let result = await couponsService.validateCoupon(code, orderValue);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    }
}
