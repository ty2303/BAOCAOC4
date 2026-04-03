var express = require('express');
var router = express.Router();
let wishlistsController = require('../controllers/wishlists.controller');
let { checkLogin, checkRole } = require('../utils/authHandler');

router.get('/', checkLogin, checkRole(['USER']), wishlistsController.getWishlist);
router.post('/add-items', checkLogin, checkRole(['USER']), wishlistsController.addItems);
router.post('/remove-items', checkLogin, checkRole(['USER']), wishlistsController.removeItems);

module.exports = router;
