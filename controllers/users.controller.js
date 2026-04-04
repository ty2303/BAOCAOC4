let usersService = require('../services/users.service');

module.exports = {
    getAll: async function (req, res) {
        try {
            let result = await usersService.getAll();
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    getById: async function (req, res) {
        try {
            let result = await usersService.getById(req.params.id);
            if (!result) return res.status(404).send({ message: "Không tìm thấy" });
            res.send(result);
        } catch (err) {
            res.status(404).send({ message: "ID không hợp lệ" });
        }
    },

    create: async function (req, res) {
        try {
            let result = await usersService.create(req.body);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    update: async function (req, res) {
        try {
            // User chỉ được sửa chính mình, ADMIN sửa được tất cả
            if (req.roleName !== 'ADMIN' && req.params.id !== req.userId) {
                return res.status(403).send({ message: 'Bạn không có quyền sửa tài khoản này' });
            }
            let result = await usersService.update(req.params.id, req.body);
            if (!result) return res.status(404).send({ message: "Không tìm thấy" });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    remove: async function (req, res) {
        try {
            let result = await usersService.remove(req.params.id);
            if (!result) return res.status(404).send({ message: "Không tìm thấy" });
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    }
}
