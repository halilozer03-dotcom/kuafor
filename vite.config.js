import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const port = process.env.PORT ? Number(process.env.PORT) : 4300;

export default defineConfig({
  plugins: [react()],
  server: { port, host: true },
  preview: { port, host: true },
});
