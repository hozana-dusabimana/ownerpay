import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' => relative asset paths, so the same build works when served locally
// (npm run preview) and from GitHub Pages under https://<user>.github.io/<repo>/.
export default defineConfig({
  base: './',
  plugins: [react()],
});
