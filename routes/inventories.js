var express = require('express');
var router = express.Router();
let inventoriesController = require('../controllers/inventories.controller');

router.get('/', inventoriesController.getAll);
router.post('/increase-stock', inventoriesController.increaseStock);
router.post('/decrease-stock', inventoriesController.decreaseStock);

module.exports = router;
