var express = require('express');
var router = express.Router();
let { uploadImage, uploadExcel } = require('../utils/uploadHandler');
let uploadController = require('../controllers/upload.controller');

router.post('/single', uploadImage.single('file'), uploadController.uploadSingle);
router.post('/multiple', uploadImage.array('files'), uploadController.uploadMultiple);
router.post('/excel', uploadExcel.single('file'), uploadController.importExcel);
router.get('/:filename', uploadController.viewFile);  // để cuối tránh conflict

module.exports = router;
