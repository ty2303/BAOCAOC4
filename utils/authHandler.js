let jwt = require('jsonwebtoken');
let userModel = require('../schemas/users');

let JWT_SECRET = 'BAOCAOCHIUTHU4';

module.exports = {
    // Middleware kiểm tra đã đăng nhập chưa
    checkLogin: async function (req, res, next) {
        let token;

        // Ưu tiên lấy token từ cookie
        if (req.cookies.token) {
            token = req.cookies.token;
        } else {
            // Nếu không có cookie, lấy từ header Authorization
            // Header dạng: "Bearer eyJhbGci..."
            token = req.headers.authorization;
            if (!token || !token.startsWith('Bearer')) {
                return res.status(403).send({ message: "Bạn chưa đăng nhập" });
            }
            token = token.split(' ')[1]; // Tách lấy phần token sau "Bearer "
        }

        try {
            // Giải mã token, nếu sai hoặc hết hạn sẽ throw lỗi
            let result = jwt.verify(token, JWT_SECRET);
            req.userId = result.id; // Gắn userId vào request để dùng ở route sau
            next();
        } catch (err) {
            return res.status(403).send({ message: "Token không hợp lệ hoặc đã hết hạn" });
        }
    },

    // Middleware kiểm tra role — truyền vào danh sách role được phép
    // Ví dụ: checkRole(['USER']) → chỉ USER được vào, ADMIN bị chặn
    checkRole: function (allowedRoles) {
        return async function (req, res, next) {
            let user = await userModel.findById(req.userId).populate('role');
            if (!user) return res.status(403).send({ message: "Không tìm thấy user" });

            if (!allowedRoles.includes(user.role.name)) {
                return res.status(403).send({ message: "Bạn không có quyền truy cập" });
            }
            next();
        }
    }
}