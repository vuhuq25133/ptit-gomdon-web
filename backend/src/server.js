const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 [GOMDON BACKEND] Khởi động thành công!`);
  console.log(`   * BFF API:  http://localhost:${PORT}/api`);
  console.log(`   * Health:   http://localhost:${PORT}/api/health`);
  console.log('='.repeat(60));
});
