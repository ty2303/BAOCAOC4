let wishlistsService = require('../services/wishlists.service');

module.exports = {
    getWishlist: async function (req, res) {
        try {
            let result = await wishlistsService.getWishlist(req.userId);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    addItems: async function (req, res) {
        try {
            let { product } = req.body;
            let result = await wishlistsService.addItems(req.userId, product);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    removeItems: async function (req, res) {
        try {
            let { product } = req.body;
            let result = await wishlistsService.removeItems(req.userId, product);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    }
}
