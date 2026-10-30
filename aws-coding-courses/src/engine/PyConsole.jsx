// The practice Python console: shows program output and takes Python one
// line (or block) at a time at the >>> prompt, like the real REPL. History
// with up/down, Ctrl+C to clear the line, Ctrl+L to clear the screen.
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Is this console input unfinished? Open brackets or triple quotes, a trailing
// backslash, or a block (a line ending in ":") that hasn't had its blank line yet.
export const pyIncomplete = (source) => {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (quote.length === 3 ? source.startsWith(quote, i) : c === quote) {
        i += quote.length - 1;
        quote = null;
      } else if (c === '\n' && quote.length === 1) quote = null;
      continue;
    }
    if (c === '#') { while (i < source.length && source[i] !== '\n') i++; continue; }
    if (c === '"' || c === "'") {
      quote = source.startsWith(c.repeat(3), i) ? c.repeat(3) : c;
      i += quote.length - 1;
    } else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth = Math.max(0, depth - 1);
  }
  if (quote?.length === 3 || depth > 0) return true;
  const lines = source.split('\n');
  const last = lines[lines.length - 1];
  if (/\\$/.test(last)) return true;
  const first = lines[0].replace(/#.*$/, '').trimEnd();
  const block = first.endsWith(':') || first.startsWith('@');
  return block && last.trim() !== '';
};

const PyConsole = forwardRef(({ onSubmit, busy, status, label = 'Practice Python' }, ref) => {
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState('');
  const [historyIdx, setHistoryIdx] = useState(null);
  const typed = useRef([]);
  const inputRef = useRef(null);
  const screenRef = useRef(null);

  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, busy, status]);

  const add = (more) => setLines((prev) => [...prev, ...more].slice(-1000));

  useImperativeHandle(ref, () => ({
    // A snippet run from a button: show it as if it was typed at the prompt
    echoCell: (source) => add(source.replace(/\n+$/, '').split('\n').map((l, i) => ({ kind: 'cmd', prompt: i === 0 ? '>>> ' : '... ', text: l }))),
    echoCommand: (text) => add([{ kind: 'cmd', prompt: '$ ', text }]),
    show: (transcript) => add(transcript.map((c) => ({ kind: c.stream, text: c.text }))),
    print: (kind, text) => add([{ kind, text }]),
    clear: () => setLines([]),
    focus: () => inputRef.current?.focus({ preventScroll: true }),
  }), []);

  const submit = () => {
    const source = pending ? `${pending}\n${input}` : input;
    add([{ kind: 'cmd', prompt: pending ? '... ' : '>>> ', text: input }]);
    setInput('');
    setHistoryIdx(null);
    if (!source.trim()) { setPending(''); return; }
    if (pyIncomplete(source)) { setPending(source); return; }
    setPending('');
    // The arrows bring back single lines; blocks are easier to run again from the editor
    if (!source.includes('\n')) typed.current.push(source);
    onSubmit(source);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (!busy) submit(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      setInput(`${input}    `);
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const hist = typed.current;
      if (!hist.length || pending) return;
      e.preventDefault();
      let idx = historyIdx === null ? hist.length : historyIdx;
      idx = e.key === 'ArrowUp' ? Math.max(0, idx - 1) : idx + 1;
      if (idx >= hist.length) { setHistoryIdx(null); setInput(''); return; }
      setHistoryIdx(idx);
      setInput(hist[idx]);
      return;
    }
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      add([{ kind: 'cmd', prompt: pending ? '... ' : '>>> ', text: `${input}` }, { kind: 'err', text: 'KeyboardInterrupt' }]);
      setInput('');
      setPending('');
      return;
    }
    if (e.ctrlKey && e.key === 'l') { e.preventDefault(); setLines([]); }
  };

  const starting = status === 'starting' || status === 'idle';
  return (
    <div className="terminal py-console" onClick={() => { if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true }); }}>
      <div className="terminal-bar">
        <span className="dots"><i /><i /><i /></span>
        <span className="terminal-title">{label}</span>
        <span className="terminal-hint">type Python at <code>&gt;&gt;&gt;</code>, or press Run</span>
      </div>
      <div className="terminal-screen" ref={screenRef} role="log" aria-live="polite">
        <div className="t-line t-info">Practice Python 3.13 in your browser, with a pretend AWS account. Nothing here touches your computer or a real AWS account.</div>
        {starting && <div className="t-line t-info">Starting Python… The first time takes a few seconds (about 10 MB), then your browser keeps it.</div>}
        {status === 'failed' && <div className="t-line t-err">Python couldn't start. Check your internet connection, then reload the page.</div>}
        {lines.map((l, i) => (
          l.kind === 'cmd'
            ? <div key={i} className="t-line"><span className="t-prompt">{l.prompt}</span>{l.text}</div>
            : <div key={i} className={`t-line t-${l.kind}`}>{l.text.replace(/\n$/, '')}</div>
        ))}
        {busy && <div className="t-line t-info t-busy">running…</div>}
        {/* Always mounted, so typing focus survives a run (Enter waits until it ends) */}
        <div className="t-line t-input-line">
          <span className="t-prompt">{pending ? '... ' : '>>> '}</span>
          <input
            ref={inputRef}
            className="t-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-label="Python console input"
          />
        </div>
      </div>
    </div>
  );
});

export default PyConsole;
