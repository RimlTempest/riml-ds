import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 4 フレームワークで同じ 1 ページを配る（docs/testing.md）。dev サーバではなくビルド成果を配る
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: { input: { index: 'index.html', controlled: 'controlled.html' } },
  },
})
