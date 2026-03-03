import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      {
        find: /^@uc-teamspace\/shared\/(.*)$/,
        replacement: path.resolve(__dirname, '../shared/$1.ts'),
      },
      {
        find: '@uc-teamspace/shared',
        replacement: path.resolve(__dirname, '../shared/index.ts'),
      },
    ],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
