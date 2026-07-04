import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      format: { comments: false },
    },
    lib: {
      entry: 'src/main.js',
      name: 'verifi',
      formats: ['iife'],
      fileName: () => 'v.js',
    },
  },
});
