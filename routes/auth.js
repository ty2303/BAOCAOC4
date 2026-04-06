var express = require('express');
var router = express.Router();
let userModel = require('../schemas/users');
let cartModel = require('../schemas/carts');
let jwt = require('jsonwebtoken');
let bcrypt = require('bcrypt');
let crypto = require('crypto');
let mailHandler = require('../utils/sendMailHandler');
let { checkLogin } = require('../utils/authHandler');

let JWT_SECRET = 'BAOCAOCHIUTHU4';

// POST /register - đăng ký tài khoản mới
router.post('/register', async function (req, res) {
    try {
        let newUser = new userModel(req.body);
        await newUser.save();

        // Tạo cart rỗng cho user mới
        let newCart = new cartModel({ user: newUser._id });
        await newCart.save();

        res.send({ message: "Đăng ký thành công", data: newUser });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// POST /login - đăng nhập
router.post('/login', async function (req, res) {
    try {
        let user = await userModel.findOne({ username: req.body.username, isDeleted: false });
        if (!user) return res.status(404).send({ message: "Sai tài khoản hoặc mật khẩu" });

        let isMatch = bcrypt.compareSync(req.body.password, user.password);
        if (!isMatch) return res.status(404).send({ message: "Sai tài khoản hoặc mật khẩu" });

        let token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { maxAge: 60 * 60 * 1000, httpOnly: true });
        res.send({ token });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// POST /logout - đăng xuất
router.post('/logout', function (req, res) {
    res.cookie('token', null, { maxAge: 0, httpOnly: true });
    res.send({ message: "Đăng xuất thành công" });
});

// GET /me - lấy thông tin user đang login
router.get('/me', checkLogin, async function (req, res) {
    try {
        let user = await userModel.findOne({ _id: req.userId, isDeleted: false }).populate('role');
        res.send(user);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// POST /changepassword - đổi mật khẩu
router.post('/changepassword', checkLogin, async function (req, res) {
    try {
        let { oldPassword, newPassword } = req.body;
        let user = await userModel.findById(req.userId);
        if (!user) return res.status(404).send({ message: 'Không tìm thấy user' });

        let isMatch = bcrypt.compareSync(oldPassword, user.password);
        if (!isMatch) throw new Error('Mật khẩu cũ không đúng');

        // Gán mật khẩu mới → pre('save') hook sẽ tự hash
        user.password = newPassword;
        await user.save();
        res.send({ message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// POST /forgotpassword - quên mật khẩu
router.post('/forgotpassword', async function (req, res) {
    try {
        let user = await userModel.findOne({ email: req.body.email, isDeleted: false });
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
});

// POST /resetpassword/:token - đặt lại mật khẩu
router.post('/resetpassword/:token', async function (req, res) {
    try {
        let user = await userModel.findOne({
            forgotpasswordToken: req.params.token,
            forgotpasswordTokenExp: { $gt: new Date() }  // token còn hạn
        });
        if (!user) return res.status(404).send({ message: 'Token không hợp lệ hoặc đã hết hạn' });

        user.password = req.body.password;
        user.forgotpasswordToken = null;
        user.forgotpasswordTokenExp = null;
        await user.save();

        res.send({ message: 'Đặt lại mật khẩu thành công' });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
