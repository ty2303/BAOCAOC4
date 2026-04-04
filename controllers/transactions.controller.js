const transactionsService = require("../services/transactions.service");
let userModel = require("../schemas/users");

module.exports = {
    getByUser: async (req, res) => {
        try {
            const result = await transactionsService.getByUser(req.userId, req.query);
            res.send(result);
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    },

    getAllForAdmin: async (req, res) => {
        try {
            const result = await transactionsService.getAllForAdmin(req.query);
            res.send(result);
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    },

    getByOrder: async (req, res) => {
        try {
            const orderId = req.params.orderId;
            const currentUser = await userModel.findById(req.userId).populate("role");

            if (!currentUser) {
                return res.status(403).send({ message: "Khong tim thay user" });
            }

            const result = await transactionsService.getByOrder(orderId);
            if (!result || result.length === 0) {
                return res.status(404).send({ message: "Khong tim thay giao dich" });
            }

            if (
                currentUser.role.name !== "ADMIN" &&
                result[0].userId.toString() !== req.userId
            ) {
                return res.status(403).send({ message: "Ban khong co quyen truy cap" });
            }

            res.send(result);
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const transactionId = req.params.id;
            const currentUser = await userModel.findById(req.userId).populate("role");

            if (!currentUser) {
                return res.status(403).send({ message: "Khong tim thay user" });
            }

            const result = await transactionsService.getById(transactionId);
            if (!result) {
                return res.status(404).send({ message: "Khong tim thay giao dich" });
            }

            if (
                currentUser.role.name !== "ADMIN" &&
                result.userId._id.toString() !== req.userId
            ) {
                return res.status(403).send({ message: "Ban khong co quyen truy cap" });
            }

            res.send(result);
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    },

    updateStatus: async (req, res) => {
        try {
            const result = await transactionsService.updateStatus(
                req.params.id,
                req.body.status
            );
            res.send(result);
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    },

    createRefund: async (req, res) => {
        try {
            const result = await transactionsService.createRefund(
                req.params.orderId,
                req.userId
            );
            res.send(result);
        } catch (error) {
            res.status(400).send({ message: error.message });
        }
    }
};
