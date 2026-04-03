var express = require('express');
var router = express.Router();
let couponsController = require('../controllers/coupons.controller');
let { checkLogin, checkRole } = require('../utils/authHandler');

router.get('/', checkLogin, checkRole(['ADMIN']), couponsController.getAll);
router.get('/:id', checkLogin, checkRole(['ADMIN']), couponsController.getById);
router.post('/', checkLogin, checkRole(['ADMIN']), couponsController.create);
router.put('/:id', checkLogin, checkRole(['ADMIN']), couponsController.update);
router.delete('/:id', checkLogin, checkRole(['ADMIN']), couponsController.remove);
router.patch('/:id/toggle-active', checkLogin, checkRole(['ADMIN']), couponsController.toggleActive);

router.post('/validate', checkLogin, checkRole(['USER']), couponsController.validateCoupon);

module.exports = router;
