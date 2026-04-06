var express = require('express');
var router = express.Router();
let path = require('path');
let fs = require('fs');
let excelJS = require('exceljs');
let mongoose = require('mongoose');
let slugify = require('slugify');
let productModel = require('../schemas/products');
let inventoryModel = require('../schemas/inventories');
let { uploadImage, uploadExcel } = require('../utils/uploadHandler');

// POST /single - upload 1 ảnh
router.post('/single', uploadImage.single('file'), function (req, res) {
    if (!req.file) {
        return res.status(400).send({ message: 'Không có file nào được upload' });
    }
    res.send({ path: req.file.path, filename: req.file.filename });
});

// POST /multiple - upload nhiều ảnh
router.post('/multiple', uploadImage.array('files'), function (req, res) {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send({ message: 'Không có file nào được upload' });
    }
    let result = req.files.map(f => ({
        filename: f.filename,
        path: f.path,
        size: f.size
    }));
    res.send(result);
});

// POST /excel - import sản phẩm từ file excel
router.post('/excel', uploadExcel.single('file'), async function (req, res) {
    if (!req.file) {
        return res.status(400).send({ message: 'Không có file nào được upload' });
    }

    let pathFile = path.join(__dirname, '../uploads', req.file.filename);

    let workbook = new excelJS.Workbook();
    await workbook.xlsx.readFile(pathFile);
    let worksheet = workbook.worksheets[0];

    let products = await productModel.find({});
    let getTitle = products.map(p => p.title);
    let getSku = products.map(p => p.sku);

    let result = [];
    let batchSize = 50;
    let maxCommit = Math.ceil((worksheet.rowCount - 1) / batchSize);

    for (let timeCommit = 0; timeCommit < maxCommit; timeCommit++) {
        let start = 2 + batchSize * timeCommit;
        let end = Math.min(start + batchSize - 1, worksheet.rowCount);

        let validProducts = [];
        let mapProductToStock = new Map();

        for (let i = start; i <= end; i++) {
            let errorRow = [];
            let row = worksheet.getRow(i);

            let sku      = row.getCell(1).value;
            let title    = row.getCell(2).value;
            let category = row.getCell(3).value;
            let price    = Number.parseInt(row.getCell(4).value);
            let stock    = Number.parseInt(row.getCell(5).value);

            if (isNaN(price) || price < 0) errorRow.push('price không hợp lệ: ' + price);
            if (isNaN(stock) || stock < 0) errorRow.push('stock không hợp lệ: ' + stock);
            if (getTitle.includes(title))  errorRow.push('title đã tồn tại: ' + title);
            if (getSku.includes(sku))      errorRow.push('sku đã tồn tại: ' + sku);

            if (errorRow.length > 0) {
                result.push({ row: i, success: false, errors: errorRow });
                continue;
            }

            let newProduct = new productModel({
                sku, title, category, price,
                description: title,
                slug: slugify(title, { locale: 'vi', trim: true })
            });

            mapProductToStock.set(sku, stock);
            validProducts.push(newProduct);
            getSku.push(sku);
            getTitle.push(title);
        }

        if (validProducts.length > 0) {
            let session = await mongoose.startSession();
            session.startTransaction();
            try {
                let savedProducts = await productModel.insertMany(validProducts, { session });
                let inventories = savedProducts.map(p => ({
                    product: p._id,
                    stock: mapProductToStock.get(p.sku)
                }));
                await inventoryModel.insertMany(inventories, { session });
                await session.commitTransaction();
                session.endSession();
                savedProducts.forEach(p => {
                    result.push({ row: null, success: true, title: p.title });
                });
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                result.push({ success: false, errors: [error.message] });
            }
        }
    }

    fs.unlinkSync(pathFile);
    res.send(result);
});

// GET /:filename - xem file đã upload (để cuối tránh conflict)
router.get('/:filename', function (req, res) {
    let pathFile = path.join(__dirname, '../uploads', req.params.filename);
    res.sendFile(pathFile);
});

module.exports = router;
