var express = require('express');
var router = express.Router();
let addressesController = require('../controllers/addresses.controller');
let { checkLogin, checkRole } = require('../utils/authHandler');

router.get('/', checkLogin, checkRole(['USER']), addressesController.getMyAddresses);
router.get('/:id', checkLogin, checkRole(['USER']), addressesController.getById);
router.post('/', checkLogin, checkRole(['USER']), addressesController.create);
router.put('/:id', checkLogin, checkRole(['USER']), addressesController.update);
router.delete('/:id', checkLogin, checkRole(['USER']), addressesController.remove);
router.patch('/:id/default', checkLogin, checkRole(['USER']), addressesController.setDefault);

module.exports = router;
