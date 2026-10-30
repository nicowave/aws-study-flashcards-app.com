// A small code editor for the practice files. Every edit goes to onChange
// right away (the shell's file system, or the next Python run) and is kept
// in this browser.
import React, { useEffect, useRef, useState } from 'react';

const keyFor = (storageId, path) => `awsCourse_editor_${storageId}_${path}`;

export const savedFile = (storageId, file) => {
  try {
    return localStorage.getItem(keyFor(storageId, file.path)) ?? file.starter ?? '';
  } catch {
    return file.starter ?? '';
  }
};

const Editor = ({ file, storageId, onChange, onRun, runLabel }) => {
  const [text, setText] = useState(() => savedFile(storageId, file));
  const area = useRef(null);
  const gutter = useRef(null);
  const indent = file.path.endsWith('.py') ? '    ' : '  '; // Python's habit is 4 spaces

  useEffect(() => {
    onChange(text);
    try { localStorage.setItem(keyFor(storageId, file.path), text); } catch { /* private mode */ }
  }, [onChange, file, storageId, text]);

  const onKeyDown = (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const el = e.target;
      const { selectionStart: s, selectionEnd: end } = el;
      const next = `${text.slice(0, s)}${indent}${text.slice(end)}`;
      setText(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + indent.length; });
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); onRun?.(); return; }
    // Enter keeps the line's indent, and adds one after a line ending in ":" (Python blocks)
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      const el = e.target;
      const { selectionStart: s, selectionEnd: end } = el;
      const line = text.slice(text.lastIndexOf('\n', s - 1) + 1, s);
      let lead = line.match(/^[ \t]*/)[0];
      if (indent.length === 4 && /:\s*(#.*)?$/.test(line)) lead += indent;
      e.preventDefault();
      setText(`${text.slice(0, s)}\n${lead}${text.slice(end)}`);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 1 + lead.length; });
    }
  };

  const reset = () => {
    if (window.confirm('Start this file over? Your changes will be replaced with the starting version.')) setText(file.starter ?? '');
  };

  const lineCount = text.split('\n').length;
  return (
    <div className="editor">
      <div className="editor-bar">
        <span className="editor-tab">{file.path}</span>
        <span className="editor-actions">
          <button type="button" className="code-btn" onClick={reset}>Start over</button>
          <button type="button" className="code-btn run-code" onClick={onRun} title="Ctrl or ⌘ + Enter">▶ {runLabel}</button>
        </span>
      </div>
      <div className="editor-body">
        <div className="editor-gutter" ref={gutter} aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <textarea
          ref={area}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={(e) => { if (gutter.current) gutter.current.scrollTop = e.target.scrollTop; }}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          aria-label={`Edit ${file.path}`}
          rows={Math.min(22, Math.max(8, lineCount + 1))}
        />
      </div>
    </div>
  );
};

export default Editor;
