import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_API_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://localhost:5096';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@routes': path.resolve(__dirname, './src/routes'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@store': path.resolve(__dirname, './src/store'),
        '@types': path.resolve(__dirname, './src/types'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@constants': path.resolve(__dirname, './src/constants'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(moduleId) {
            if (moduleId.includes('node_modules/react-icons')) return 'ui-vendor';
            if (moduleId.includes('node_modules/axios')) return 'http-vendor';
            if (moduleId.includes('node_modules/@reduxjs/toolkit') || moduleId.includes('node_modules/react-redux')) {
              return 'state-vendor';
            }
            if (
              moduleId.includes('node_modules/react/') ||
              moduleId.includes('node_modules/react-dom/') ||
              moduleId.includes('node_modules/react-router-dom/')
            ) {
              return 'react-vendor';
            }

            return undefined;
          },
        },
      },
    },
  };
});
