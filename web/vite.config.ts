import { fileURLToPath, URL } from 'node:url'
// defineConfig lấy từ 'vitest/config' chứ không phải 'vite' — bản của vitest
// bổ sung kiểu cho khối `test`, dùng bản của vite sẽ lỗi biên dịch.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    postcss: {},
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase'
          }
        },
      },
    },
  },
  test: {
    // Logic thuần trong shared/domain/ không đụng DOM (§14 quy ước 3),
    // nên môi trường node là đủ và chạy nhanh hơn jsdom.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
