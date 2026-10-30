// Renders lesson text (Markdown, written by us and bundled with the site).
// Practice code blocks (```bash for the shell, ```python for Python, ```js and
// ```ts for JavaScript and TypeScript) get a "Run" button when that practice
// area is on the page; every block gets "Copy". Any other fence word is shown
// as the block's label, e.g. ```index.mjs for a file on the learner's computer.
import React, { useMemo } from 'react';
import { Marked } from 'marked';

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const LABELS = {
  bash: 'practice shell', python: 'practice Python', js: 'practice JavaScript', javascript: 'practice JavaScript',
  ts: 'practice TypeScript', typescript: 'practice TypeScript', sh: 'your terminal', py: 'on your computer',
  html: 'HTML', css: 'CSS', json: 'JSON', yaml: 'YAML', console: 'output', text: '',
};

// Which fences get Run for each kind of practice area
const RUNNABLE = { bash: ['bash'], python: ['python'], js: ['js', 'javascript'], ts: ['ts', 'typescript', 'js', 'javascript'] };

const makeParser = (runLang) => {
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      code({ text, lang }) {
        const language = (lang || '').trim();
        const label = LABELS[language] ?? language;
        const run = runLang && RUNNABLE[runLang].includes(language)
          ? `<button type="button" class="code-btn run-code" data-code="${escapeHtml(text)}">▶ Run</button>`
          : '';
        return `<div class="code-block lang-${escapeHtml(language || 'text')}">` +
          `<div class="code-bar"><span>${escapeHtml(label)}</span><span class="code-actions">${run}<button type="button" class="code-btn copy-code" data-code="${escapeHtml(text)}">Copy</button></span></div>` +
          `<pre><code>${escapeHtml(text)}</code></pre></div>`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
      },
    },
  });
  return marked;
};

const parsers = Object.fromEntries([['none', makeParser(null)], ...Object.keys(RUNNABLE).map((lang) => [lang, makeParser(lang)])]);

const Markdown = ({ text, onRun, runLang = 'bash', className = '' }) => {
  const inline = className.split(' ').includes('inline');
  const html = useMemo(() => {
    const parser = parsers[onRun ? runLang : 'none'];
    return inline ? parser.parseInline(text || '') : parser.parse(text || '');
  }, [text, onRun, runLang, inline]);
  const onClick = (e) => {
    const btn = e.target.closest('.code-btn');
    if (!btn) return;
    const code = btn.dataset.code;
    if (btn.classList.contains('run-code')) onRun?.(code);
    else {
      navigator.clipboard?.writeText(code).then(() => {
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      }).catch(() => {});
    }
  };
  // eslint-disable-next-line react/no-danger
  const Tag = inline ? 'span' : 'div';
  return <Tag className={`md ${className}`} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default Markdown;
