import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// https://vite.js.org/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    port: 3000,
    host: true
  }
});
