import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Codespaces expone el puerto con un dominio *.app.github.dev
    allowedHosts: ['.app.github.dev'],
    // En Codespaces el navegador entra por HTTPS (puerto 443)
    hmr: process.env.CODESPACES ? { clientPort: 443 } : undefined,
  },
});
