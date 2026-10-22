import React, { useState, useEffect, useRef, useCallback } from 'react';
import { studyGuides } from '../data/studyGuide';
import { ArrowLeftIcon, ChevronDownIcon } from './Icons';
import './StudyGuide.css';

// Content Block Renderer
const ContentBlock = ({ block, domainColor }) => {
  switch (block.type) {
    case 'paragraph':
      return <p className="study-block-paragraph">{block.text}</p>;

    case 'keyTerm':
      return (
        <div className="study-block-keyterm" style={{ borderLeftColor: domainColor }}>
          <div className="study-keyterm-label" style={{ color: domainColor }}>{block.term}</div>
          <div className="study-keyterm-definition">{block.definition}</div>
        </div>
      );

    case 'bulletList':
      return (
        <div className="study-block-list">
          {block.title && <div className="list-title">{block.title}</div>}
          <ul>
            {block.items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      );

    case 'numberedList':
      return (
        <div className="study-block-list">
          {block.title && <div className="list-title">{block.title}</div>}
          <ol>
            {block.items.map((item, i) => <li key={i}>{item}</li>)}
          </ol>
        </div>
      );

    case 'awsService':
      return (
        <div className="study-block-service">
          <span className="study-service-icon">☁️</span>
          <div>
            <div className="study-service-name">{block.name}</div>
            <div className="study-service-description">{block.description}</div>
          </div>
        </div>
      );

    case 'examTip':
      return (
        <div className="study-block-examtip">
          <span className="study-examtip-icon">💡</span>
          <div className="study-examtip-text">{block.text}</div>
        </div>
      );

    case 'comparison':
      return (
        <div className="study-block-comparison">
          {block.title && <div className="comparison-title">{block.title}</div>}
          <div className="study-comparison-grid">
            {block.items.map((item, i) => (
              <div key={i} className="study-comparison-item">
                <div className="study-comparison-label" style={{ color: domainColor }}>{item.label}</div>
                <div className="study-comparison-desc">{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'table':
      return (
        <div className="study-block-table">
          <table>
            <thead>
              <tr>
                {block.headers.map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => <td key={j}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return null;
  }
};

// Article Reader View
const ArticleReader = ({ guide, onBack }) => {
  const [activeSection, setActiveSection] = useState(guide.sections[0]?.id || '');
  const [tocOpen, setTocOpen] = useState(false);
  const sectionRefs = useRef({});
  const contentRef = useRef(null);

  // IntersectionObserver for active TOC tracking
  useEffect(() => {
    const observers = [];
    const sectionElements = guide.sections.map(s => sectionRefs.current[s.id]).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-20px 0px -70% 0px', threshold: 0 }
    );

    sectionElements.forEach(el => {
      observer.observe(el);
      observers.push(observer);
    });

    return () => observer.disconnect();
  }, [guide.sections]);

  const scrollToSection = useCallback((sectionId) => {
    const el = sectionRefs.current[sectionId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setTocOpen(false);
    }
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="study-article-header">
        <button className="study-back-btn" onClick={onBack}>
          <ArrowLeftIcon size={18} />
          <span>Topics</span>
        </button>
        <div className="study-article-title">
          <span className="domain-icon">{guide.icon}</span>
          <h2>{guide.name}</h2>
          <span
            className="domain-weight-badge"
            style={{ backgroundColor: guide.color }}
          >
            {guide.weight}
          </span>
        </div>
      </div>

      {/* Mobile TOC Toggle */}
      <button
        className="study-toc-toggle"
        onClick={() => setTocOpen(!tocOpen)}
      >
        📑 Table of Contents
        <span className={`study-toc-toggle-icon ${tocOpen ? 'open' : ''}`}>
          <ChevronDownIcon size={16} />
        </span>
      </button>

      <div className="study-article" style={{ '--domain-color': guide.color }}>
        {/* TOC Sidebar */}
        <nav className={`study-toc ${tocOpen ? 'mobile-open' : ''}`}>
          <div className="study-toc-title">Contents</div>
          <div className="study-toc-list">
            {guide.sections.map(section => (
              <button
                key={section.id}
                className={`study-toc-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => scrollToSection(section.id)}
              >
                {section.title}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="study-content" ref={contentRef}>
          {guide.sections.map(section => (
            <section
              key={section.id}
              id={section.id}
              className="study-section"
              ref={el => { sectionRefs.current[section.id] = el; }}
            >
              <h3 className="study-section-heading">{section.title}</h3>
              {section.content.map((block, i) => (
                <ContentBlock key={i} block={block} domainColor={guide.color} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Study Guide Component
const StudyGuide = ({ onBack }) => {
  const [selectedGuide, setSelectedGuide] = useState(null);

  // Domain selection view
  if (!selectedGuide) {
    return (
      <div className="study-guide">
        <div className="study-header">
          <div>
            <h2>Deep Dive Study Guides</h2>
            <p className="study-subtitle">Select a domain for an in-depth study guide</p>
          </div>
        </div>

        <div className="study-domain-grid">
          {studyGuides.map(guide => (
            <button
              key={guide.id}
              className="study-domain-card"
              onClick={() => setSelectedGuide(guide)}
            >
              <span className="domain-icon">{guide.icon}</span>
              <span className="domain-name">{guide.name}</span>
              <span className="domain-weight">{guide.weight}</span>
              <span className="domain-description">{guide.description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Article reader view
  return (
    <ArticleReader
      guide={selectedGuide}
      onBack={() => setSelectedGuide(null)}
    />
  );
};

export default StudyGuide;
