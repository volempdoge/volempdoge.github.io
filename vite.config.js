import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  build: {
    // The server entry only feeds scripts/prerender.mjs; it needs no public/ copy.
    copyPublicDir: !isSsrBuild,
  },
  test: {
    include: ['tests/unit/**/*.test.{js,jsx}'],
  },
}));
