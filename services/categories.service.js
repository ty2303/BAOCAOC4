let categoryModel = require('../schemas/categories');

module.exports = {
    getAll: async function () {
        return await categoryModel.find({ isDeleted: false });
    },

    getById: async function (id) {
        return await categoryModel.findOne({ _id: id, isDeleted: false });
    },

    create: async function (data) {
        let newCategory = new categoryModel(data);
        await newCategory.save();
        return newCategory;
    },

    update: async function (id, data) {
        return await categoryModel.findByIdAndUpdate(id, data, { new: true });
    },

    remove: async function (id) {
        return await categoryModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }
}
