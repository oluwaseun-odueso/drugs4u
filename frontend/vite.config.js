import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => {
          const [pathname, query] = path.split('?');
          const fixed = pathname.endsWith('.php') ? pathname : pathname + '.php';
          return query ? `${fixed}?${query}` : fixed;
        },
      },
    },
  },
});
