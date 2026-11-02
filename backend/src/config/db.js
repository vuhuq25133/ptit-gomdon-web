const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'StrongPassword@2026',
  database: process.env.PG_DATABASE || 'gomdon_lakehouse',
  max: 10,                // Tối đa 10 kết nối đồng thời
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] Lỗi kết nối PostgreSQL:', err.message);
});

module.exports = pool;
