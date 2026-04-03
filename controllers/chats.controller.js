let chatsService = require('../services/chats.service');

module.exports = {
    getMyMessages: async function (req, res) {
        try {
            let result = await chatsService.getMessagesByUser(req.userId);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    getAllRooms: async function (req, res) {
        try {
            let result = await chatsService.getAllRooms();
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    },

    getMessagesByUserId: async function (req, res) {
        try {
            let result = await chatsService.getMessagesByUser(req.params.userId);
            res.send(result);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    }
};
