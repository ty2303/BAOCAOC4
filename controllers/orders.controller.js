const ordersService = require("../services/orders.service");

module.exports = {
	// tạo đơn hàng từ giỏ hàng
	createOrder: async (req, res) => {
		try {
			const userId = req.userId;
			const orderData = req.body;
			const result = await ordersService.createOrder(userId, orderData);
			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	},
};
