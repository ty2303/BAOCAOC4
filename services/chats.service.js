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

    createMessage: async function (userId, senderId, senderType, content, clientMessageId) {
        let room = await this.findOrCreateRoomByUser(userId);

        // Neu client gui lai cung 1 tin nhan do mat mang/timeout thi tra lai ban ghi cu
        if (clientMessageId) {
            let oldMessage = await messageModel.findOne({
                room: room._id,
                clientMessageId: clientMessageId
            });

            if (oldMessage) {
                return {
                    message: oldMessage,
                    created: false,
                    room: room
                };
            }
        }

        let newMessage = new messageModel({
            room: room._id,
            sender: senderId,
            senderType: senderType,
            content: content,
            clientMessageId: clientMessageId || null
        });
        try {
            await newMessage.save();
        } catch (err) {
            if (err.code === 11000 && clientMessageId) {
                let oldMessage = await messageModel.findOne({
                    room: room._id,
                    clientMessageId: clientMessageId
                });

                if (oldMessage) {
                    return {
                        message: oldMessage,
                        created: false,
                        room: room
                    };
                }
            }

            throw err;
        }

        room.lastMessage = content;
        room.lastSenderType = senderType;
        room.save().catch(function (err) {
            console.error('room.save that bai:', err.message);
        });

        return {
            message: newMessage,
            created: true,
            room: room
        };
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
