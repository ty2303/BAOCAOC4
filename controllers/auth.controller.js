let usersService = require('../services/users.service');
let rolesService = require('../services/roles.service');
let cartModel = require('../schemas/carts');
let jwt = require('jsonwebtoken');
let crypto = require('crypto');
let mailHandler = require('../utils/sendMailHandler');

const JWT_SECRET = 'BAOCAOCHIUTHU4';

module.exports = {
    register: async function (req, res) {
        try {
            let role = await rolesService.getByName('USER');
            if (!role) {
                return res.status(400).send({ message: 'Role USER chua ton tai' });
            }

            let payload = { ...req.body, role: role._id };
            delete payload.accountType;
            delete payload.roleName;

            let result = await usersService.create(payload);

            // Tao cart rong cho user moi
            let newCart = new cartModel({ user: result._id });
            await newCart.save();

            res.send({ message: 'Dang ky thanh cong', data: result, role: role.name });
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    login: async function (req, res) {
        try {
            let user = await usersService.getByUsername(req.body.username);
            if (!user) return res.status(404).send({ message: 'Sai tai khoan hoac mat khau' });

            let accountType = String(req.body.accountType || req.body.roleName || '').trim().toUpperCase();
            if (accountType && user.role && user.role.name !== accountType) {
                return res.status(403).send({ message: 'Tai khoan khong thuoc nhom dang nhap da chon' });
            }

            let isMatch = usersService.checkPassword(req.body.password, user.password);
            if (!isMatch) return res.status(404).send({ message: 'Sai tai khoan hoac mat khau' });

            let rememberMe = req.body.rememberMe === true || req.body.rememberMe === 'true';
            let expiresIn = rememberMe ? '30d' : '1d';
            let maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

            let token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn });
            res.cookie('token', token, { maxAge, httpOnly: true });
            res.send({
                token,
                role: user.role ? user.role.name : '',
                userId: user._id,
                username: user.username
            });
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    logout: function (req, res) {
        res.cookie('token', null, { maxAge: 0, httpOnly: true });
        res.send({ message: 'Dang xuat thanh cong' });
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
            if (!result) return res.status(404).send({ message: 'Khong tim thay user' });
            res.send({ message: 'Doi mat khau thanh cong' });
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    forgotPassword: async function (req, res) {
        try {
            let user = await usersService.findByEmail(req.body.email);
            if (!user) return res.status(404).send({ message: 'Email khong ton tai' });

            user.forgotpasswordToken = crypto.randomBytes(21).toString('hex');
            user.forgotpasswordTokenExp = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();

            let url = 'http://localhost:3000/api/v1/auth/resetpassword/' + user.forgotpasswordToken;
            await mailHandler.sendMail(user.email, url);

            res.send({ message: 'Kiem tra email de dat lai mat khau' });
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    resetPassword: async function (req, res) {
        try {
            let user = await usersService.findByForgotToken(req.params.token);
            if (!user) return res.status(404).send({ message: 'Token khong hop le hoac da het han' });

            user.password = req.body.password;
            user.forgotpasswordToken = null;
            user.forgotpasswordTokenExp = null;
            await user.save();

            res.send({ message: 'Dat lai mat khau thanh cong' });
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    }
};
