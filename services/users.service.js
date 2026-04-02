let userModel = require('../schemas/users');
let bcrypt = require('bcrypt');

module.exports = {
    getAll: async function () {
        return await userModel.find({ isDeleted: false })
            .populate({ path: 'role', select: 'name' });
    },

    getById: async function (id) {
        return await userModel.findOne({ _id: id, isDeleted: false })
            .populate('role');
    },

    getByUsername: async function (username) {
        return await userModel.findOne({ username: username, isDeleted: false });
    },

    create: async function (data) {
        let newUser = new userModel(data);
        await newUser.save();
        return newUser;
    },

    update: async function (id, data) {
        let user = await userModel.findById(id);
        if (!user) return null;
        for (const key of Object.keys(data)) {
            user[key] = data[key];
        }
        await user.save(); // dùng save() để trigger pre('save') hash password nếu đổi pass
        return user;
    },

    remove: async function (id) {
        return await userModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    },

    checkPassword: function (inputPassword, hashedPassword) {
        return bcrypt.compareSync(inputPassword, hashedPassword);
    }
}
