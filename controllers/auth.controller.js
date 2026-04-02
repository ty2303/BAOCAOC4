let usersService = require('../services/users.service');
let jwt = require('jsonwebtoken');

const JWT_SECRET = 'BAOCAOCHIUTHU4';

module.exports = {
    register: async function (req, res) {
        try {
            let result = await usersService.create(req.body);
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

            let token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, { maxAge: 60 * 60 * 1000, httpOnly: true });
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
    }
}
