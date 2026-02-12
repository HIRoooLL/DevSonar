import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  envDir: resolve(__dirname, '..', '..'),
  plugins: [react()],
  server: {
    port: 3000,
  },
});
