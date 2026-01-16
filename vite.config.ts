import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Use root base so assets resolve correctly on Firebase Hosting and other origins.
  base: '/',
  plugins: [
    react()
  ],
});
