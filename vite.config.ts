import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@models': path.resolve(__dirname, './src/models'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@course': path.resolve(__dirname, './src/Course'),
      '@participant': path.resolve(__dirname, './src/Participant'),
      '@elapsed-time': path.resolve(__dirname, './src/ElapsedTime'),
      '@gpx-file': path.resolve(__dirname, './src/GPXFile'),
    },
  },
  base: '/crashcourse/', // This should match your repository name
});
