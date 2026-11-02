const express = require('express');
const cors = require('cors');
require('dotenv').config();

const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000' })); // Chỉ cho phép Vite FE
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
app.use('/api/conversations', conversationRoutes);
app.use('/api/conversations', messageRoutes);  // /:id/messages
app.use('/api/orders', orderRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'gomdon-backend', port: process.env.PORT });
});

// ── 404 fallback ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route không tồn tại' });
});

module.exports = app;
