import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite configuration for the Vue SPA.
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
  },
});
