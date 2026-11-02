const pool = require('../config/db');

/**
 * GET /api/conversations/:id/messages
 * Lấy toàn bộ tin nhắn trong 1 hội thoại (cho Cột 2).
 */
const getMessages = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        conversation_id,
        sender_type,
        content,
        has_extracted_order,
        created_at
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC;
    `, [id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[messageController] getMessages lỗi:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/conversations/:id/messages
 * Gửi tin nhắn phản hồi cho khách (Lưu DB + Gọi Meta Graph API bắn về Messenger của người thật).
 */
const sendMessage = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Nội dung tin nhắn không được để trống.' });
  }

  try {
    // 1. Lấy thông tin hội thoại (để lấy PSID của khách hàng)
    const convResult = await pool.query(`
      SELECT id, channel, channel_conversation_id FROM conversations WHERE id = $1
    `, [id]);

    if (convResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Hội thoại không tồn tại.' });
    }

    const conv = convResult.rows[0];

    // 2. Lưu tin nhắn của Shop vào bảng messages (sender_type = 'shop')
    const insertResult = await pool.query(`
      INSERT INTO messages (conversation_id, sender_type, content, has_extracted_order, created_at)
      VALUES ($1, 'shop', $2, false, NOW())
      RETURNING id, conversation_id, sender_type, content, has_extracted_order, created_at;
    `, [id, content.trim()]);

    const savedMsg = insertResult.rows[0];

    // 3. Nếu là kênh Facebook và có cấu hình token, gửi trực tiếp qua Meta Graph API
    const pageAccessToken = process.env.FB_PAGE_ACCESS_TOKEN;
    if (conv.channel === 'facebook' && pageAccessToken && conv.channel_conversation_id) {
      try {
        const fbRes = await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${pageAccessToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: conv.channel_conversation_id },
            message: { text: content.trim() }
          })
        });
        const fbData = await fbRes.json();
        console.log(`[Facebook Send API] Gửi tin nhắn đến PSID ${conv.channel_conversation_id}:`, fbData);
      } catch (fbErr) {
        console.error('[Facebook Send API Error]:', fbErr.message);
      }
    }

    res.json({ success: true, data: savedMsg });
  } catch (err) {
    console.error('[messageController] sendMessage lỗi:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getMessages, sendMessage };
