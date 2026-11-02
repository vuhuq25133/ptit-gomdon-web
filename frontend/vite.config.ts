import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,        // Đổi từ 5173 -> 3000 theo sổ tay giai đoạn 2
    strictPort: true,  // Báo lỗi ngay nếu port 3000 bị chiếm, không tự chuyển
    proxy: {
      // Proxy API calls từ frontend -> Node.js backend (port 4000)
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
