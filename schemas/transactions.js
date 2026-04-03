let mongoose = require('mongoose');

let Schema = mongoose.Schema;

let transactionSchema = new Schema({
    // orderId (ObjectId, ref 'order')
    orderId: {type: mongoose.Types.ObjectId, ref: 'order', unique: true},

    userId: {type: Schema.Types.ObjectId, ref: 'user', required: true},

    amount: {type: Number, required: true},

    type: {type: String, enum: ['payment', 'refund'], default: 'payment' },

    status: {type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },

    paymentMethod: {type: String, enum: ['cod', 'banking', 'momo'],required: true},
    
}, { timestamps: true}
)
module.exports = mongoose.model('transaction', transactionSchema);