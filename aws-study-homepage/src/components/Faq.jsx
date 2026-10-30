// Frequently asked questions. The build adds the same list as FAQPage
// structured data, so keep the words here and in data/faq.js one and the same.
import React from 'react';
import { FAQ } from '../data/faq';

const Faq = () => (
  <section id="faq" className="faq-section">
    <div className="section-header">
      <h2 className="section-title">Questions People Ask</h2>
      <p className="section-subtitle">About the certifications, the exam simulators and what it costs.</p>
    </div>
    <div className="faq-list">
      {FAQ.map(({ q, a }) => (
        <details key={q} className="faq-item">
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  </section>
);

export default Faq;
