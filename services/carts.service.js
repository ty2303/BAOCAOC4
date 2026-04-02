let cartModel = require('../schemas/carts');

module.exports = {
    getCart: async function (userId) {
        let cart = await cartModel.findOne({ user: userId });
        return cart ? cart.items : [];
    },

    addItems: async function (userId, product, quantity) {
        let cart = await cartModel.findOne({ user: userId });

        // Kiểm tra product đã có trong giỏ chưa
        let index = cart.items.findIndex(item => item.product == product);

        if (index < 0) {
            // Chưa có → thêm mới
            cart.items.push({ product, quantity });
        } else {
            // Đã có → cộng thêm số lượng
            cart.items[index].quantity += quantity;
        }

        await cart.save();
        return cart;
    },

    decreaseItems: async function (userId, product, quantity) {
        let cart = await cartModel.findOne({ user: userId });

        let index = cart.items.findIndex(item => item.product == product);

        if (index >= 0) {
            if (cart.items[index].quantity > quantity) {
                // Còn dư → trừ bớt
                cart.items[index].quantity -= quantity;
            } else {
                // Bằng hoặc ít hơn → xóa hẳn khỏi giỏ
                cart.items.splice(index, 1);
            }
        }

        await cart.save();
        return cart;
    }
}
