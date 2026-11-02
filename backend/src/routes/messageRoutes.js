const express = require('express');
const { getMessages, sendMessage } = require('../controllers/messageController');

const router = express.Router();

// GET /api/conversations/:id/messages
router.get('/:id/messages', getMessages);

// POST /api/conversations/:id/messages (Gửi tin nhắn phản hồi)
router.post('/:id/messages', sendMessage);

module.exports = router;
