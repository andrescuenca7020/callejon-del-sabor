import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: './tsconfig.json',
      jit: true
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      input: ['index.html']
    }
  },
  server: {
    port: 3000
  },
  define: {
    'process.env': {},
    global: 'globalThis'
  }
});
