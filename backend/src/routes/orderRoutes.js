const express = require('express');
const { getDraftOrder, confirmOrder } = require('../controllers/orderController');

const router = express.Router();

// GET  /api/orders/draft/:customerId   – Lấy đơn nháp theo customer
router.get('/draft/:customerId', getDraftOrder);

// POST /api/orders/:orderId/confirm    – Xác nhận chốt đơn (Task 2.6)
router.post('/:orderId/confirm', confirmOrder);

module.exports = router;
