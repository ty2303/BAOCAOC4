let reviewsService = require('../services/reviews.service');

module.exports = {
    getByProduct: async function (req, res) {
        try {
            let result = await reviewsService.getByProduct(req.params.productId);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    create: async function (req, res) {
        try {
            let result = await reviewsService.create(req.userId, req.body);
            res.send(result);
        } catch (err) {
            if (err.code === 11000) {
                return res.status(400).send({ message: 'Ban da danh gia san pham nay roi' });
            }
            res.status(400).send({ message: err.message });
        }
    },

    remove: async function (req, res) {
        try {
            let result = await reviewsService.remove(req.params.id);
            if (!result) return res.status(404).send({ message: 'Khong tim thay review' });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    }
};
