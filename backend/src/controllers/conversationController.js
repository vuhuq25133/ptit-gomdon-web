const pool = require('../config/db');

/**
 * GET /api/conversations
 * Lấy danh sách hội thoại kèm thông tin khách và đơn nháp (nếu có).
 * Sắp xếp: mới nhất lên đầu.
 */
const getConversations = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id,
        c.channel,
        c.channel_conversation_id,
        c.customer_id,
        c.created_at,
        COALESCE(
          c.sender_name, 
          cu.full_name, 
          'Khách Facebook (' || RIGHT(c.channel_conversation_id, 6) || ')'
        ) AS customer_name,
        COALESCE(
          c.sender_avatar,
          'https://api.dicebear.com/7.x/bottts/svg?seed=' || c.channel_conversation_id
        ) AS customer_avatar,
        cu.phone         AS customer_phone,
        'https://business.facebook.com/latest/inbox/messenger?selected_item_id=' || c.channel_conversation_id AS inbox_link,
        -- Tin nhắn cuối cùng (preview)
        (
          SELECT m.content
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message,
        (
          SELECT m.created_at
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message_at,
        -- Đơn hàng nháp liên quan
        o.id             AS order_id,
        o.order_code,
        o.status         AS order_status,
        o.total_amount
      FROM conversations c
      LEFT JOIN customers cu ON cu.id = c.customer_id
      LEFT JOIN LATERAL (
        SELECT 
          ord.id, 
          ord.order_code, 
          ord.status, 
          ord.total_amount
        FROM orders ord 
        WHERE ord.customer_id = c.customer_id 
          AND ord.source_order_id LIKE 'FB_%' 
          AND ord.status IN ('draft', 'processing')
        ORDER BY ord.created_at DESC 
        LIMIT 1
      ) o ON true
      ORDER BY COALESCE(
        (SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id),
        c.created_at
      ) DESC
      LIMIT 50;
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[conversationController] getConversations lỗi:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getConversations };
