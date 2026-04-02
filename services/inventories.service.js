let inventoryModel = require('../schemas/inventories');

module.exports = {
    getAll: async function () {
        // populate() = JOIN với collection products
        // chỉ lấy fields title và price của product
        return await inventoryModel.find().populate({
            path: 'product',
            select: 'title price'
        });
    },

    increaseStock: async function (productId, quantity) {
        // Tìm inventory theo product id
        let inventory = await inventoryModel.findOne({ product: productId });
        if (!inventory) return null;

        inventory.stock += quantity;  // cộng thêm số lượng
        await inventory.save();       // lưu lại
        return inventory;
    },

    decreaseStock: async function (productId, quantity) {
        let inventory = await inventoryModel.findOne({ product: productId });
        if (!inventory) return null;

        // Kiểm tra đủ hàng không
        if (inventory.stock < quantity) {
            throw new Error('Không đủ số lượng trong kho');
        }

        inventory.stock -= quantity;  // trừ số lượng
        await inventory.save();
        return inventory;
    }
}
