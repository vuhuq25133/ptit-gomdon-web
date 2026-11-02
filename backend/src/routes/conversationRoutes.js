const express = require('express');
const { getConversations } = require('../controllers/conversationController');

const router = express.Router();

// GET /api/conversations
router.get('/', getConversations);

module.exports = router;
