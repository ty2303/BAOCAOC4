const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Email không đúng định dạng"]
        },
        fullName: { type: String, default: "" },
        avatarUrl: { type: String, default: "https://i.sstatic.net/l60Hf.png" },
        status: { type: Boolean, default: false },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'role',
            required: true
        },
        loginCount: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false },
        forgotpasswordToken: String,
        forgotpasswordTokenExp: Date
    },
    { timestamps: true }
);
// Tự động hash password trước khi save
userSchema.pre('save', function (next) {
    let salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(
        this.password, salt
    )
})
module.exports = mongoose.model('user', userSchema);

