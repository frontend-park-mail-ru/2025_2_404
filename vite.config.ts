import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import legacy from '@vitejs/plugin-legacy';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
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
    // Плагин для оптимизации изображений при сборке
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      includePublic: true,
      logStats: true,
      // Оптимизация PNG
      png: {
        quality: 80,
        compressionLevel: 9,
      },
      // Оптимизация JPEG
      jpeg: {
        quality: 80,
        progressive: true,
      },
      // Оптимизация WebP
      webp: {
        lossless: false,
        quality: 80,
      },
      // Оптимизация SVG через SVGO
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,
              },
            },
          },
          'sortAttrs',
        ],
      },
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
  // Настройки CSS
  css: {
    devSourcemap: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Минификация JavaScript с помощью esbuild (по умолчанию)
    minify: 'esbuild',
    // Настройки CSS минификации
    cssMinify: true,
    // Настройки Rollup для дополнительной оптимизации
    rollupOptions: {
      output: {
        // Разделение кода на чанки для лучшей производительности
        manualChunks: {
          vendor: ['chart.js'],
        },
        // Хеширование имен файлов для кеширования
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Порог предупреждения о размере чанка (500 KB)
    chunkSizeWarningLimit: 500,
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
