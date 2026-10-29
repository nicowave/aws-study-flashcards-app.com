import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

// One engine, one site per course: COURSE=bash npm run build -> dist/bash/
const COURSE = process.env.COURSE || 'bash';
const courseDir = fileURLToPath(new URL(`./src/courses/${COURSE}/`, import.meta.url));
const meta = JSON.parse(readFileSync(`${courseDir}meta.json`, 'utf8'));

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'course-meta',
      // 'pre' so the placeholders are filled before Vite parses the page's links
      transformIndexHtml: {
        order: 'pre',
        handler: (html) =>
          html
            .replaceAll('%COURSE_TITLE%', meta.pageTitle)
            .replaceAll('%COURSE_DESCRIPTION%', meta.description)
            .replaceAll('%COURSE_URL%', meta.url),
      },
    },
  ],
  resolve: { alias: { '@course': `${courseDir}index.js` } },
  build: {
    outDir: `dist/${COURSE}`,
    emptyOutDir: true,
    rollupOptions: { output: { manualChunks: { vendor: ['react', 'react-dom'] } } },
  },
  test: { include: ['src/**/*.test.js'] },
});
