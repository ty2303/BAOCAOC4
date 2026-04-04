const ordersService = require("../services/orders.service");

module.exports = {
	// tạo đơn hàng từ giỏ hàng
	createOrder: async (req, res) => {
		try {
			const result = await ordersService.createOrder(req.userId, req.body);
			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	},

	// ADMIN: lấy tất cả đơn hàng
	getAllOrders: async (req, res) => {
		try {
			const result = await ordersService.getAllOrders(req.query);
			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	},

	// ADMIN: cập nhật trạng thái đơn hàng
	updateOrderStatus: async (req, res) => {
		try {
			const result = await ordersService.updateOrderStatus(req.params.orderId, req.body.status);
			res.send(result);
		} catch (error) {
			res.status(400).send({ message: error.message });
		}
	}
};
