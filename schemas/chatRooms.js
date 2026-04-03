let mongoose = require('mongoose');

let chatRoomSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true
    },
    lastMessage: { type: String, default: '' },
    lastSenderType: {
        type: String,
        enum: ['ADMIN', 'USER']
    }
}, { timestamps: true });

module.exports = mongoose.model('chatRoom', chatRoomSchema);
