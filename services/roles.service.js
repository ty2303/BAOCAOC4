let roleModel = require('../schemas/roles');

module.exports = {
    getAll: async function () {
        return await roleModel.find({ isDeleted: false });
    },

    getById: async function (id) {
        return await roleModel.findOne({ _id: id, isDeleted: false });
    },

    create: async function (data) {
        let newRole = new roleModel(data);
        await newRole.save();
        return newRole;
    },

    update: async function (id, data) {
        return await roleModel.findByIdAndUpdate(id, data, { new: true });
    },

    remove: async function (id) {
        return await roleModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }
}
