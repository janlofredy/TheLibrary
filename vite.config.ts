import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  base: './', // Ensures assets load properly on GitHub Pages and subpaths
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'pinia'],
          'tiptap-vendor': ['@tiptap/vue-3', '@tiptap/starter-kit', '@tiptap/extension-placeholder'],
          'db-vendor': ['dexie'],
        },
      },
    },
  },
})
