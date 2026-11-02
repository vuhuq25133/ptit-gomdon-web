const pool = require('../config/db');

/**
 * GET /api/orders/draft/:customerId
 * Lấy đơn nháp mới nhất của khách (cho Cột 3).
 */
const getDraftOrder = async (req, res) => {
  const { customerId } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT
        o.id,
        o.order_code,
        o.source_channel,
        o.status,
        o.shipping_name,
        o.shipping_phone,
        o.shipping_address,
        o.shipping_city,
        o.total_amount,
        o.note,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'sku', oi.sku,
              'name', oi.product_name,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.price,
              'price', oi.price,
              'total_price', (oi.quantity * oi.price)
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.customer_id = $1
        AND o.status IN ('draft', 'processing')
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 1;
    `, [customerId]);

    if (rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[orderController] getDraftOrder lỗi:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/orders/:orderId/confirm  (Task 2.6 & Human-in-the-loop HITL)
 * Chuyển đơn nháp 'draft' → 'processing' kèm lưu lại các thông tin chỉnh sửa nếu nhân viên can thiệp.
 */
const confirmOrder = async (req, res) => {
  const { orderId } = req.params;
  const {
    shipping_name,
    shipping_phone,
    shipping_address,
    shipping_city,
    note,
    total_amount,
    items
  } = req.body || {};

  try {
    let query;
    let params;

    if (shipping_name || shipping_phone || shipping_address) {
      query = `
        UPDATE orders
        SET
          shipping_name = COALESCE($1, shipping_name),
          shipping_phone = COALESCE($2, shipping_phone),
          shipping_address = COALESCE($3, shipping_address),
          shipping_city = COALESCE($4, shipping_city),
          note = COALESCE($5, note),
          total_amount = COALESCE($6, total_amount),
          status = 'processing',
          updated_at = NOW()
        WHERE id = $7
        RETURNING id, order_code, status, shipping_name, shipping_phone, shipping_address, shipping_city, total_amount, updated_at;
      `;
      params = [
        shipping_name || null,
        shipping_phone || null,
        shipping_address || null,
        shipping_city || null,
        note || null,
        total_amount ? Number(total_amount) : null,
        orderId
      ];
    } else {
      query = `
        UPDATE orders
        SET status = 'processing', updated_at = NOW()
        WHERE id = $1
        RETURNING id, order_code, status, updated_at;
      `;
      params = [orderId];
    }

    const { rows } = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Đơn hàng không tồn tại.'
      });
    }

    // Cập nhật lại các dòng sản phẩm nếu có chỉnh sửa
    if (items && Array.isArray(items) && items.length > 0) {
      await pool.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
      for (const it of items) {
        await pool.query(`
          INSERT INTO order_items (order_id, sku, product_name, quantity, price)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          orderId,
          it.sku || 'POLO-BLK-L',
          it.name || it.product_name || 'Áo Polo Cotton Nam',
          it.quantity || 1,
          it.unit_price || it.price || 250000
        ]);
      }
    }

    console.log(`[✅ CONFIRM ORDER] Mã đơn ${rows[0].order_code} đã chốt sang 'processing'!`);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[orderController] confirmOrder lỗi:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getDraftOrder, confirmOrder };
