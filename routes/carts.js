var express = require('express');
var router = express.Router();
let cartModel = require('../schemas/carts');
let { checkLogin, checkRole } = require('../utils/authHandler');

router.get('/', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let userId = req.userId;
        let currentCart = await cartModel.findOne({ user: userId });

        if (!currentCart) {
            currentCart = await cartModel.create({ user: userId, items: [] });
        }

        res.send(currentCart.items);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.post('/add-items', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let userId = req.userId;
        let { product, quantity } = req.body;
        let currentCart = await cartModel.findOne({ user: userId });

        if (!currentCart) {
            currentCart = await cartModel.create({ user: userId, items: [] });
        }

        let index = currentCart.items.findIndex(function (item) {
            return item.product == product;
        });

        if (index < 0) {
            currentCart.items.push({
                product: product,
                quantity: quantity
            });
        } else {
            currentCart.items[index].quantity += quantity;
        }

        await currentCart.save();
        res.send(currentCart);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.post('/decrease-items', checkLogin, checkRole(['USER']), async function (req, res) {
    try {
        let userId = req.userId;
        let { product, quantity } = req.body;
        let currentCart = await cartModel.findOne({ user: userId });

        if (!currentCart) {
            currentCart = await cartModel.create({ user: userId, items: [] });
        }

        let index = currentCart.items.findIndex(function (item) {
            return item.product == product;
        });

        if (index >= 0) {
            if (currentCart.items[index].quantity > quantity) {
                currentCart.items[index].quantity -= quantity;
            } else {
                currentCart.items.splice(index, 1);
            }
        }

        await currentCart.save();
        res.send(currentCart);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

module.exports = router;
