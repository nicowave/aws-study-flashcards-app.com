// "Build it for real" checklist; ticks are saved with the course progress.
import React from 'react';
import Markdown from '../Markdown';

const Checklist = ({ items, checked, onChange }) => (
  <ul className="checklist">
    {items.map((item, i) => {
      const on = checked.includes(i);
      return (
        <li key={i} className={on ? 'on' : ''}>
          <label>
            <input type="checkbox" checked={on} onChange={() => onChange(on ? checked.filter((x) => x !== i) : [...checked, i].sort())} />
            <Markdown text={item} className="inline" />
          </label>
        </li>
      );
    })}
  </ul>
);

export default Checklist;
