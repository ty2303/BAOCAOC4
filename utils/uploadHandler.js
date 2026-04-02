let multer = require('multer');
let path = require('path');

// Cấu hình nơi lưu file và tên file
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // lưu vào thư mục uploads/
    },
    filename: function (req, file, cb) {
        let ext = path.extname(file.originalname);  // lấy đuôi file (.jpg, .xlsx...)
        // tên file = timestamp + số random + đuôi → tránh trùng tên
        let fileName = Date.now() + '-' + Math.round(Math.random() * 1_000_000_000) + ext;
        cb(null, fileName);
    }
});

// Chỉ cho phép upload file ảnh
let filterImage = function (req, file, cb) {
    if (file.mimetype.includes('image')) {
        cb(null, true);   // chấp nhận
    } else {
        cb(new Error('File sai định dạng, chỉ nhận ảnh'), false);  // từ chối
    }
};

// Chỉ cho phép upload file Excel
let filterExcel = function (req, file, cb) {
    if (file.mimetype.includes('spreadsheetml')) {
        cb(null, true);
    } else {
        cb(new Error('File sai định dạng, chỉ nhận Excel'), false);
    }
};

module.exports = {
    uploadImage: multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 },  // giới hạn 5MB
        fileFilter: filterImage
    }),
    uploadExcel: multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: filterExcel
    })
};
