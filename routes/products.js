var express = require('express');
var router = express.Router();
let productsController = require('../controllers/products.controller');
let { checkLogin, checkRole } = require('../utils/authHandler');

// GET có query params: ?title=áo&minPrice=100&maxPrice=500&page=1&limit=5
router.get('/', productsController.getAll);
router.get('/:id', productsController.getById);
router.post('/', checkLogin, checkRole(['ADMIN']), productsController.create);
router.put('/:id', checkLogin, checkRole(['ADMIN']), productsController.update);
router.delete('/:id', checkLogin, checkRole(['ADMIN']), productsController.remove);

module.exports = router;
