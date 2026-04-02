var express = require('express');
var router = express.Router();
let usersController = require('../controllers/users.controller');
let { checkLogin } = require('../utils/authHandler');

router.get('/', checkLogin, usersController.getAll);
router.get('/:id', checkLogin, usersController.getById);
router.post('/', usersController.create);
router.put('/:id', checkLogin, usersController.update);
router.delete('/:id', checkLogin, usersController.remove);

module.exports = router;
