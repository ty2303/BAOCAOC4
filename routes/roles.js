var express = require('express');
var router = express.Router();
let rolesController = require('../controllers/roles.controller');

router.get('/', rolesController.getAll);
router.get('/:id', rolesController.getById);
router.post('/', rolesController.create);
router.put('/:id', rolesController.update);
router.delete('/:id', rolesController.remove);

module.exports = router;
