// Renders lesson text (Markdown, written by us and bundled with the site).
// ```bash blocks get a "Run" button when a practice terminal is on the page;
// every code block gets "Copy".
import React, { useMemo } from 'react';
import { Marked } from 'marked';

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const makeParser = (runnable) => {
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      code({ text, lang }) {
        const language = (lang || '').trim();
        const label = { bash: 'practice shell', sh: 'your terminal', console: 'output', text: '' }[language] ?? language;
        const run = runnable && language === 'bash'
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

const parsers = { true: makeParser(true), false: makeParser(false) };

const Markdown = ({ text, onRun, className = '' }) => {
  const inline = className.split(' ').includes('inline');
  const html = useMemo(() => {
    const parser = parsers[!!onRun];
    return inline ? parser.parseInline(text || '') : parser.parse(text || '');
  }, [text, onRun, inline]);
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
