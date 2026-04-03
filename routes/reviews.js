var express = require('express');
var router = express.Router();
let reviewsController = require('../controllers/reviews.controller');
let { checkLogin, checkRole } = require('../utils/authHandler');

router.get('/product/:productId', reviewsController.getByProduct);
router.post('/', checkLogin, checkRole(['USER']), reviewsController.create);
router.delete('/:id', checkLogin, checkRole(['ADMIN']), reviewsController.remove);

module.exports = router;
