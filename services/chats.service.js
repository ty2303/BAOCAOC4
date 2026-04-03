let chatRoomModel = require('../schemas/chatRooms');
let messageModel = require('../schemas/messages');
let userModel = require('../schemas/users');

module.exports = {
    findOrCreateRoomByUser: async function (userId) {
        let room = await chatRoomModel.findOne({ user: userId });

        if (!room) {
            room = new chatRoomModel({
                user: userId
            });
            await room.save();
        }

        return room;
    },

    createMessage: async function (userId, senderId, senderType, content) {
        let room = await this.findOrCreateRoomByUser(userId);

        let newMessage = new messageModel({
            room: room._id,
            sender: senderId,
            senderType: senderType,
            content: content
        });
        await newMessage.save();

        room.lastMessage = content;
        room.lastSenderType = senderType;
        await room.save();

        return newMessage;
    },

    getMessagesByUser: async function (userId) {
        let room = await this.findOrCreateRoomByUser(userId);

        let messages = await messageModel.find({ room: room._id })
            .populate({
                path: 'sender',
                select: 'username fullName role'
            })
            .sort({ createdAt: 1 });

        return messages;
    },

    getAllRooms: async function () {
        return await chatRoomModel.find()
            .populate({
                path: 'user',
                select: 'username fullName email role'
            })
            .sort({ updatedAt: -1 });
    }
};
