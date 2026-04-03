let mongoose = require('mongoose');

let Schema = mongoose.Schema;

let transactionSchema = new Schema({
    // orderId (ObjectId, ref 'order')
    orderId: {type: mongoose.Types.ObjectId, ref: 'order', required: true},

    userId: {type: Schema.Types.ObjectId, ref: 'user', required: true},

    amount: {type: Number, required: true},

    type: {type: String, enum: ['payment', 'refund'], default: 'payment' },

    status: {type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },

    paymentMethod: {type: String, enum: ['cod', 'banking', 'momo'],required: true},
    
}, { timestamps: true}
)

transactionSchema.index({ orderId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('transaction', transactionSchema);
