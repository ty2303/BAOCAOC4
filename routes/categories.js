var express = require('express');
var router = express.Router();
let categoriesController = require('../controllers/categories.controller');
let { checkLogin, checkRole } = require('../utils/authHandler');

router.get('/', categoriesController.getAll);
router.get('/:id', categoriesController.getById);
router.post('/', checkLogin, checkRole(['ADMIN']), categoriesController.create);
router.put('/:id', checkLogin, checkRole(['ADMIN']), categoriesController.update);
router.delete('/:id', checkLogin, checkRole(['ADMIN']), categoriesController.remove);

module.exports = router;
