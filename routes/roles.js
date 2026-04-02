var express = require('express');
var router = express.Router();
let rolesController = require('../controllers/roles.controller');
let { checkLogin, checkRole } = require('../utils/authHandler');

// Chỉ ADMIN mới được quản lý roles
router.get('/', checkLogin, checkRole(['ADMIN']), rolesController.getAll);
router.get('/:id', checkLogin, checkRole(['ADMIN']), rolesController.getById);
router.post('/', checkLogin, checkRole(['ADMIN']), rolesController.create);
router.put('/:id', checkLogin, checkRole(['ADMIN']), rolesController.update);
router.delete('/:id', checkLogin, checkRole(['ADMIN']), rolesController.remove);

module.exports = router;
