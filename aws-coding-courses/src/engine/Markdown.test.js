// Code-block buttons follow the interface language, whatever the fence word is.
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import Markdown from './Markdown';
import { LangProvider } from './i18n';

const render = (lang, text, props = {}) => renderToString(
  React.createElement(LangProvider, { languages: [lang] }, React.createElement(Markdown, { text, ...props })),
);

describe('Markdown code blocks', () => {
  it('label Copy and Run in the interface language', () => {
    expect(render('es', '```text\nhola\n```')).toContain('>Copiar<');
    expect(render('es', '```bash\nls\n```', { onRun: () => {} })).toContain('▶ Ejecutar');
    expect(render('en', '```es\nhola\n```')).toContain('>Copy<');
  });
});
