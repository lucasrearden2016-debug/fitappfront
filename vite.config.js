import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Codespaces expone el puerto con un dominio *.app.github.dev
    allowedHosts: ['.app.github.dev'],
    // En desarrollo, /api se reenvía al backend (sin CORS ni URLs absolutas)
    proxy: { '/api': 'http://localhost:3000' },
  },
});
