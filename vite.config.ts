import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  plugins: [
    handlebars({
      partialDirectory: resolve(__dirname, 'pages'),
    }),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@pages': resolve(__dirname, './pages'),
      '@services': resolve(__dirname, './services'),
      '@public': resolve(__dirname, './public'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://adnet.website',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
