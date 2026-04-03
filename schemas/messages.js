let mongoose = require('mongoose');

let messageSchema = mongoose.Schema({
    room: {
        type: mongoose.Types.ObjectId,
        ref: 'chatRoom',
        required: true
    },
    sender: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
        required: true
    },
    senderType: {
        type: String,
        enum: ['ADMIN', 'USER'],
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('message', messageSchema);
