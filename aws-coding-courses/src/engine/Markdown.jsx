// Renders lesson text (Markdown, written by us and bundled with the site).
// Practice code blocks (```bash for the shell, ```python for Python, ```js and
// ```ts for JavaScript and TypeScript) get a "Run" button when that practice
// area is on the page; every block gets "Copy". Any other fence word is shown
// as the block's label, e.g. ```index.mjs for a file on the learner's computer.
import React, { useMemo } from 'react';
import { Marked } from 'marked';
import { onThisName } from '../config/auth.config';
import { useLang, translate } from './i18n';

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const LABELS = {
  bash: 'practice shell', python: 'practice Python', js: 'practice JavaScript', javascript: 'practice JavaScript',
  ts: 'practice TypeScript', typescript: 'practice TypeScript', sh: 'your terminal', py: 'on your computer',
  html: 'HTML', css: 'CSS', json: 'JSON', yaml: 'YAML', console: 'output', text: '',
};

// Which fences get Run for each kind of practice area
const RUNNABLE = { bash: ['bash'], python: ['python'], js: ['js', 'javascript'], ts: ['ts', 'typescript', 'js', 'javascript'] };

const makeParser = (runLang, lang = 'en') => {
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      // `fence` is the code block's word (```bash); `lang` stays the interface language
      code({ text, lang: fence }) {
        const language = (fence || '').trim();
        const label = LABELS[language] ?? language;
        const run = runLang && RUNNABLE[runLang].includes(language)
          ? `<button type="button" class="code-btn run-code" data-code="${escapeHtml(text)}">${translate(lang, 'code.run')}</button>`
          : '';
        return `<div class="code-block lang-${escapeHtml(language || 'text')}">` +
          `<div class="code-bar"><span>${escapeHtml(label)}</span><span class="code-actions">${run}<button type="button" class="code-btn copy-code" data-code="${escapeHtml(text)}">${translate(lang, 'code.copy')}</button></span></div>` +
          `<pre><code>${escapeHtml(text)}</code></pre></div>`;
      },
      link({ href: written, title, tokens }) {
        // A link to another Study Hub site stays on the name this page was opened on.
        const href = onThisName(written);
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
      },
    },
  });
  return marked;
};

// One parser per practice language and interface language, made the first time it's needed
const parsers = {};
const parserFor = (runLang, lang) => {
  const key = `${runLang || 'none'}:${lang}`;
  if (!parsers[key]) parsers[key] = makeParser(runLang, lang);
  return parsers[key];
};

const Markdown = ({ text, onRun, runLang = 'bash', className = '' }) => {
  const { lang } = useLang();
  const inline = className.split(' ').includes('inline');
  const html = useMemo(() => {
    const parser = parserFor(onRun ? runLang : null, lang);
    return inline ? parser.parseInline(text || '') : parser.parse(text || '');
  }, [text, onRun, runLang, inline, lang]);
  const onClick = (e) => {
    const btn = e.target.closest('.code-btn');
    if (!btn) return;
    const code = btn.dataset.code;
    if (btn.classList.contains('run-code')) onRun?.(code);
    else {
      navigator.clipboard?.writeText(code).then(() => {
        btn.textContent = translate(lang, 'code.copied');
        setTimeout(() => { btn.textContent = translate(lang, 'code.copy'); }, 1500);
      }).catch(() => {});
    }
  };
  // eslint-disable-next-line react/no-danger
  const Tag = inline ? 'span' : 'div';
  return <Tag className={`md ${className}`} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default Markdown;
