// A writing task: rewrite a message in the other language or another register.
// The draft is kept in this browser; "Check my text" looks for the key terms.
import React, { useState } from 'react';
import Markdown from '../Markdown';
import { useT } from '../i18n';
import { checkRewrite } from './rewrite';

const read = (key) => { try { return localStorage.getItem(key) || ''; } catch { return ''; } };
const write = (key, v) => { try { localStorage.setItem(key, v); } catch { /* private mode */ } };

const Rewrite = ({ step, storageId, done, onDone }) => {
  const t = useT();
  const key = `awsCourse_rewrite_${storageId}`;
  const inputId = `rewrite-${storageId}`;
  const [text, setText] = useState(() => read(key));
  const [result, setResult] = useState(null);
  const [showModel, setShowModel] = useState(false);

  const check = () => {
    const r = checkRewrite(text, step);
    setResult(r);
    if (r.ok && !done) onDone();
  };

  return (
    <div className="rewrite">
      {step.source && (
        <div className="rewrite-source">
          <span className="eyebrow">{t('rewrite.source')}</span>
          <Markdown text={step.source} />
        </div>
      )}
      {step.task && <div className="rewrite-task"><Markdown text={step.task} /></div>}
      <label className="rewrite-label" htmlFor={inputId}>{t('rewrite.yourText')}</label>
      <textarea
        id={inputId}
        lang={step.target}
        rows={6}
        value={text}
        placeholder={t('rewrite.placeholder')}
        onChange={(e) => { setText(e.target.value); write(key, e.target.value); setResult(null); }}
      />
      <div className="rewrite-actions">
        <button type="button" className="btn" onClick={check} disabled={!text.trim()}>{t('rewrite.check')}</button>
        <button type="button" className="btn ghost" onClick={() => setShowModel(!showModel)} aria-expanded={showModel}>
          {showModel ? t('rewrite.hideModel') : t('rewrite.showModel')}
        </button>
      </div>
      {result && (
        <div className={`rewrite-feedback ${result.ok ? 'right' : 'wrong'}`} role="status">
          {result.ok ? <p>✓ {t('rewrite.passed')}</p> : (
            <>
              {result.tooShort && <p>{t('rewrite.tooShort', result.minWords)}</p>}
              {result.missing.length > 0 && <p><strong>{t('rewrite.missing')}</strong> {result.missing.join(' · ')}</p>}
              {result.avoided.map((a) => (
                <p key={a.term}><strong>{t('rewrite.avoid')}</strong> “{a.term}” — <Markdown text={a.why} className="inline" /></p>
              ))}
            </>
          )}
        </div>
      )}
      {showModel && (
        <div className="rewrite-model">
          <span className="eyebrow">{t('rewrite.model')}</span>
          <Markdown text={step.model} />
        </div>
      )}
    </div>
  );
};

export default Rewrite;
