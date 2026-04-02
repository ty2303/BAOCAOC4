var express = require('express');
var router = express.Router();
let productsController = require('../controllers/products.controller');

// GET có query params: ?title=áo&minPrice=100&maxPrice=500&page=1&limit=5
router.get('/', productsController.getAll);
router.get('/:id', productsController.getById);
router.post('/', productsController.create);
router.put('/:id', productsController.update);
router.delete('/:id', productsController.remove);

module.exports = router;
