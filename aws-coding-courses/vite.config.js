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
      // Each course site is its own host, so it needs its own robots.txt and sitemap
      generateBundle() {
        const emit = (fileName, source) => this.emitFile({ type: 'asset', fileName, source });
        emit('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${meta.url}/sitemap.xml\n`);
        emit('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${meta.url}/</loc></url>
</urlset>
`);
      },
    },
  ],
  resolve: { alias: { '@course': `${courseDir}index.js` } },
  worker: { format: 'es' }, // the practice Python's worker loads Pyodide with import()
  build: {
    outDir: `dist/${COURSE}`,
    emptyOutDir: true,
    rollupOptions: { output: { manualChunks: { vendor: ['react', 'react-dom'] } } },
  },
  test: { include: ['src/**/*.test.js'] },
});
