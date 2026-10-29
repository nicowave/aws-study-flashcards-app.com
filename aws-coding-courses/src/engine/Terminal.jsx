// The practice terminal: a prompt wired to the in-browser Shell. Supports
// history (up/down), multi-line input for if/for/while, Tab completion,
// Ctrl+C and Ctrl+L. Parent pages can run commands through the ref.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { isIncomplete } from './shell/parser';
import { COMMAND_NAMES } from './shell/commands';
import { HOME } from './shell/fs';

const shortPath = (p) => (p === HOME ? '~' : p.startsWith(`${HOME}/`) ? `~${p.slice(HOME.length)}` : p);

const Terminal = forwardRef(({ shell, onCommand, welcome, label = 'Practice terminal' }, ref) => {
  const [lines, setLines] = useState(() => (welcome ? [{ kind: 'info', text: welcome }] : []));
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(''); // earlier lines of a multi-line command
  const [historyIdx, setHistoryIdx] = useState(null);
  const typed = useRef([]);
  const inputRef = useRef(null);
  const screenRef = useRef(null);

  const prompt = () => (pending ? '> ' : `learner@${shell.vars.HOSTNAME}:${shortPath(shell.fs.cwd)}$ `);

  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const execute = useCallback((source, shownPrompt) => {
    const echo = source.split('\n').map((l, i) => ({ kind: 'cmd', prompt: i === 0 ? shownPrompt : '> ', text: l }));
    const result = shell.run(source);
    setLines((prev) => {
      let next = [...prev, ...echo];
      for (const chunk of result.transcript) {
        if (chunk.text.includes('\u001bc')) { next = []; continue; }
        next.push({ kind: chunk.stream, text: chunk.text });
      }
      return next.slice(-800);
    });
    onCommand?.(result);
    return result;
  }, [shell, onCommand]);

  useImperativeHandle(ref, () => ({
    run: (code) => {
      const cmd = code.replace(/\n+$/, '');
      typed.current.push(cmd);
      setPending('');
      setInput('');
      const res = execute(cmd, `learner@${shell.vars.HOSTNAME}:${shortPath(shell.fs.cwd)}$ `);
      inputRef.current?.focus({ preventScroll: true });
      return res;
    },
    focus: () => inputRef.current?.focus(),
    print: (text) => setLines((prev) => [...prev, { kind: 'info', text }]),
  }), [execute, shell]);

  const submit = () => {
    const shown = prompt();
    const source = pending ? `${pending}\n${input}` : input;
    if (isIncomplete(source)) {
      setLines((prev) => [...prev, { kind: 'cmd', prompt: shown, text: input }]);
      setPending(source);
      setInput('');
      return;
    }
    setPending('');
    setInput('');
    setHistoryIdx(null);
    if (!source.trim()) {
      setLines((prev) => [...prev, { kind: 'cmd', prompt: shown, text: input }]);
      return;
    }
    typed.current.push(source);
    // The echo of the first line(s) of a multi-line command is already on screen
    if (pending) {
      setLines((prev) => [...prev, { kind: 'cmd', prompt: shown, text: input }]);
      const result = shell.run(source);
      setLines((prev) => {
        let next = [...prev];
        for (const chunk of result.transcript) {
          if (chunk.text.includes('\u001bc')) { next = []; continue; }
          next.push({ kind: chunk.stream, text: chunk.text });
        }
        return next.slice(-800);
      });
      onCommand?.(result);
    } else execute(source, shown);
  };

  const complete = () => {
    const m = input.match(/(\S*)$/);
    const word = m[1];
    const isFirst = !input.slice(0, input.length - word.length).trim();
    let candidates;
    if (isFirst && !word.includes('/')) candidates = COMMAND_NAMES.filter((c) => c.startsWith(word) && /^[a-z]/.test(c));
    else {
      const dir = word.includes('/') ? word.slice(0, word.lastIndexOf('/') + 1) : '';
      const base = word.slice(dir.length);
      try {
        candidates = shell.fs.list(dir || '.')
          .filter((n) => n.startsWith(base) && (base.startsWith('.') || !n.startsWith('.')))
          .map((n) => dir + n + (shell.fs.isDir(`${dir || '.'}/${n}`) ? '/' : ''));
      } catch {
        candidates = [];
      }
    }
    if (candidates.length === 1) {
      setInput(input.slice(0, input.length - word.length) + candidates[0] + (candidates[0].endsWith('/') ? '' : ' '));
    } else if (candidates.length > 1) {
      let common = candidates[0];
      for (const c of candidates) while (!c.startsWith(common)) common = common.slice(0, -1);
      if (common.length > word.length) setInput(input.slice(0, input.length - word.length) + common);
      else setLines((prev) => [...prev, { kind: 'cmd', prompt: prompt(), text: input }, { kind: 'out', text: candidates.join('  ') + '\n' }]);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); return; }
    if (e.key === 'Tab') { e.preventDefault(); complete(); return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const hist = typed.current;
      if (!hist.length) return;
      e.preventDefault();
      let idx = historyIdx === null ? hist.length : historyIdx;
      idx = e.key === 'ArrowUp' ? Math.max(0, idx - 1) : idx + 1;
      if (idx >= hist.length) { setHistoryIdx(null); setInput(''); return; }
      setHistoryIdx(idx);
      setInput(hist[idx].split('\n').join('; ').replace(/(then|do|else);/g, '$1'));
      return;
    }
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      setLines((prev) => [...prev, { kind: 'cmd', prompt: prompt(), text: `${input}^C` }]);
      setInput('');
      setPending('');
      return;
    }
    if (e.ctrlKey && e.key === 'l') { e.preventDefault(); setLines([]); }
  };

  return (
    <div className="terminal" onClick={() => { if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true }); }}>
      <div className="terminal-bar">
        <span className="dots"><i /><i /><i /></span>
        <span className="terminal-title">{label}</span>
        <span className="terminal-hint">type <code>help</code> for commands</span>
      </div>
      <div className="terminal-screen" ref={screenRef} role="log" aria-live="polite">
        {lines.map((l, i) => (
          l.kind === 'cmd'
            ? <div key={i} className="t-line"><span className="t-prompt">{l.prompt}</span>{l.text}</div>
            : <div key={i} className={`t-line t-${l.kind}`}>{l.text.replace(/\n$/, '')}</div>
        ))}
        <div className="t-line t-input-line">
          <span className="t-prompt">{prompt()}</span>
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
            aria-label="Terminal input"
          />
        </div>
      </div>
    </div>
  );
});

export default Terminal;
