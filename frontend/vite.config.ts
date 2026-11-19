import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // host: true permite abrir las pantallas de carril desde el celular en la misma red.
    host: true,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
