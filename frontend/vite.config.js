import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: { port: 5173 },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 350,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('/src/pages/Risk') || id.includes('/src/pages/Audit')) return 'risk-audit';
          if (id.includes('/src/pages/NightWatch')) return 'watch';
          if (id.includes('/src/components/ash/')) return 'ash-ui';
        }
      }
    }
  }
});
