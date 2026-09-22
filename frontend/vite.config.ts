import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// PHONE=1 serves over HTTPS on your LAN — phone browsers only allow the
// camera on secure origins (localhost is exempt, a LAN IP is not).
const phone = process.env.PHONE === '1';

export default defineConfig({
  plugins: [react(), ...(phone ? [basicSsl()] : [])],
  server: {
    port: 5173,
    host: phone ? true : undefined,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
