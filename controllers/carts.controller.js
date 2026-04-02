let cartsService = require('../services/carts.service');

module.exports = {
    getCart: async function (req, res) {
        try {
            let result = await cartsService.getCart(req.userId);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    addItems: async function (req, res) {
        try {
            let { product, quantity } = req.body;
            let result = await cartsService.addItems(req.userId, product, quantity);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    decreaseItems: async function (req, res) {
        try {
            let { product, quantity } = req.body;
            let result = await cartsService.decreaseItems(req.userId, product, quantity);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    }
}
