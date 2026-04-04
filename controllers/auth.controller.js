let usersService = require('../services/users.service');
let cartModel = require('../schemas/carts');
let jwt = require('jsonwebtoken');
let crypto = require('crypto');
let mailHandler = require('../utils/sendMailHandler');

const JWT_SECRET = 'BAOCAOCHIUTHU4';

module.exports = {
    register: async function (req, res) {
        try {
            let result = await usersService.create(req.body);

            // Tạo cart rỗng cho user mới
            let newCart = new cartModel({ user: result._id });
            await newCart.save();

            res.send({ message: "Đăng ký thành công", data: result });
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    login: async function (req, res) {
        try {
            let user = await usersService.getByUsername(req.body.username);
            if (!user) return res.status(404).send({ message: "Sai tài khoản hoặc mật khẩu" });

            let isMatch = usersService.checkPassword(req.body.password, user.password);
            if (!isMatch) return res.status(404).send({ message: "Sai tài khoản hoặc mật khẩu" });

            let rememberMe = req.body.rememberMe === true || req.body.rememberMe === 'true';
            let expiresIn = rememberMe ? '30d' : '1d';
            let maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

            let token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn });
            res.cookie('token', token, { maxAge, httpOnly: true });
            res.send({ token });
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    logout: function (req, res) {
        res.cookie('token', null, { maxAge: 0, httpOnly: true });
        res.send({ message: "Đăng xuất thành công" });
    },

    me: async function (req, res) {
        try {
            let user = await usersService.getById(req.userId);
            res.send(user);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    changePassword: async function (req, res) {
        try {
            let { oldPassword, newPassword } = req.body;
            let result = await usersService.changePassword(req.userId, oldPassword, newPassword);
            if (!result) return res.status(404).send({ message: 'Không tìm thấy user' });
            res.send({ message: 'Đổi mật khẩu thành công' });
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    forgotPassword: async function (req, res) {
        try {
            let user = await usersService.findByEmail(req.body.email);
            if (!user) return res.status(404).send({ message: 'Email không tồn tại' });

            // Tạo token random + thời hạn 10 phút
            user.forgotpasswordToken = crypto.randomBytes(21).toString('hex');
            user.forgotpasswordTokenExp = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();

            // Gửi mail chứa link reset
            let url = 'http://localhost:3000/api/v1/auth/resetpassword/' + user.forgotpasswordToken;
            await mailHandler.sendMail(user.email, url);

            res.send({ message: 'Kiểm tra email để đặt lại mật khẩu' });
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    resetPassword: async function (req, res) {
        try {
            let user = await usersService.findByForgotToken(req.params.token);
            if (!user) return res.status(404).send({ message: 'Token không hợp lệ hoặc đã hết hạn' });

            user.password = req.body.password;
            user.forgotpasswordToken = null;
            user.forgotpasswordTokenExp = null;
            await user.save();

            res.send({ message: 'Đặt lại mật khẩu thành công' });
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    }

}
