var express = require('express');
var router = express.Router();
let usersController = require('../controllers/users.controller');
let { checkLogin, checkRole } = require('../utils/authHandler');


router.get('/', checkLogin, checkRole(['ADMIN']), usersController.getAll);
router.get('/:id', checkLogin, usersController.getById);
router.post('/', usersController.create);
router.put('/:id', checkLogin, checkRole(['ADMIN', 'USER']), usersController.update);
router.delete('/:id', checkLogin, checkRole(['ADMIN']), usersController.remove);

module.exports = router;
