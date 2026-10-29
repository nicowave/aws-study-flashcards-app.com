// A small code editor for script files in the practice shell. Edits are
// written into the shell's file system right away and kept in this browser.
import React, { useEffect, useRef, useState } from 'react';

const keyFor = (storageId, path) => `awsCourse_editor_${storageId}_${path}`;

export const savedFile = (storageId, file) => {
  try {
    return localStorage.getItem(keyFor(storageId, file.path)) ?? file.starter ?? '';
  } catch {
    return file.starter ?? '';
  }
};

const Editor = ({ shell, file, storageId, onRun }) => {
  const [text, setText] = useState(() => savedFile(storageId, file));
  const area = useRef(null);
  const gutter = useRef(null);

  useEffect(() => {
    shell.fs.write(file.path, text);
    if (file.executable) shell.fs.node(file.path).mode = 0o755;
    try { localStorage.setItem(keyFor(storageId, file.path), text); } catch { /* private mode */ }
  }, [shell, file, storageId, text]);

  const onKeyDown = (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const el = e.target;
      const { selectionStart: s, selectionEnd: end } = el;
      const next = `${text.slice(0, s)}  ${text.slice(end)}`;
      setText(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); onRun?.(); }
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
          <button type="button" className="code-btn run-code" onClick={onRun} title="Ctrl or ⌘ + Enter">▶ {file.runLabel || `Run bash ${file.path}`}</button>
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
