let addressesService = require('../services/addresses.service');

module.exports = {
    getMyAddresses: async function (req, res) {
        try {
            let result = await addressesService.getMyAddresses(req.userId);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    getById: async function (req, res) {
        try {
            let result = await addressesService.getById(req.params.id, req.userId);
            if (!result) return res.status(404).send({ message: 'Khong tim thay dia chi' });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    create: async function (req, res) {
        try {
            let result = await addressesService.create(req.userId, req.body);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    update: async function (req, res) {
        try {
            let result = await addressesService.update(req.params.id, req.userId, req.body);
            if (!result) return res.status(404).send({ message: 'Khong tim thay dia chi' });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    remove: async function (req, res) {
        try {
            let result = await addressesService.remove(req.params.id, req.userId);
            if (!result) return res.status(404).send({ message: 'Khong tim thay dia chi' });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    setDefault: async function (req, res) {
        try {
            let result = await addressesService.setDefault(req.params.id, req.userId);
            if (!result) return res.status(404).send({ message: 'Khong tim thay dia chi' });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    }
};
