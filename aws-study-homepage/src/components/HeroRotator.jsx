import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HERO_SLIDES } from '../data/heroSlides';
import { onThisName } from '../config/auth.config';
import { TargetIcon, CloudIcon, CodeIcon, ArrowRightIcon } from './Icons';

const ICONS = { target: TargetIcon, cloud: CloudIcon, code: CodeIcon, arrow: ArrowRightIcon };

// Rotating hero headlines: one per study track (AWS, GIS, Google Cloud, ...).
//
// How it is built, and why:
// - ONE visible slide whose elements stay the same DOM nodes; only their text changes.
//   Google's Largest Contentful Paint counts an element once, at its first paint, so swapping
//   text in place never creates a later, larger "first paint" (separate slide elements did:
//   LCP moved from 0.2 s to 7.6 s and later in the review). The h1 is always present, so the
//   page always has exactly one h1.
// - A hidden copy of every slide sits in the same grid cell, so the box keeps the height of
//   the tallest slide and nothing below it jumps. It is aria-hidden and inert.
// - WCAG 2.2.2 (Pause, Stop, Hide): the Pause button comes first in reading and tab order;
//   rotation never starts under prefers-reduced-motion, stops by itself after three rounds,
//   and holds while the pointer or keyboard focus is in the slide (not on the controls, so
//   pressing Play really plays). aria-live stays off while rotating and turns polite only
//   after a person picks a track or pauses.
// Slide 1 (AWS) matches the static page in vite.config.js, which crawlers read.

const ADVANCE_MS = 7000;
const MAX_ROUNDS = 3;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Full addresses follow the site's name; site paths ('/gis/') follow the build's root ('/' or '/next/').
const resolve = (href) => {
  if (href.startsWith('https://')) return onThisName(href);
  if (href.startsWith('/')) return `${import.meta.env.BASE_URL}${href.slice(1)}`;
  return href;
};

const SlideBody = ({ s, Title }) => (
  <>
    <div className={`hero-badge${s.soon ? ' hero-badge-soon' : ''}`}>
      <span className="badge-text mono">{s.badge}</span>
    </div>
    <Title className="hero-title">
      {s.before}<span className="highlight">{s.highlight}</span>{s.after}
    </Title>
    <p className="hero-subtitle">{s.subtitle}</p>
    <div className="hero-actions">
      {/* index keys: the same button nodes are reused when the slide changes */}
      {s.actions.map((a, i) => {
        const Icon = ICONS[a.icon];
        return (
          <a key={i} href={resolve(a.href)} className={`btn ${a.primary ? 'btn-primary' : 'btn-secondary'}`}>
            {Icon && <Icon size={20} />}
            {a.label}
          </a>
        );
      })}
    </div>
  </>
);

const HeroRotator = () => {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [announce, setAnnounce] = useState(false);
  const steps = useRef(0);
  const slideRef = useRef(null);
  const first = useRef(true);
  const total = HERO_SLIDES.length;

  // Auto-advance. Holds while the slide is hovered or focused, or the tab is hidden.
  useEffect(() => {
    if (!playing || hovered || focused) return undefined;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      // Never change a slide under keyboard focus (window switches can leave focus here).
      if (slideRef.current?.contains(document.activeElement)) return;
      steps.current += 1;
      if (steps.current >= total * MAX_ROUNDS) {
        setActive(0);
        setPlaying(false);
        return;
      }
      setActive((i) => (i + 1) % total);
    }, ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [playing, hovered, focused, total]);

  // Someone turns on reduced motion while the page is open: stop.
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq?.addEventListener) return undefined;
    const stop = (e) => { if (e.matches) setPlaying(false); };
    mq.addEventListener('change', stop);
    return () => mq.removeEventListener('change', stop);
  }, []);

  // A short fade on the same nodes when the slide changes (an opacity animation on an element
  // that has already painted is not a new LCP candidate). None for reduced motion.
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    if (prefersReducedMotion()) return;
    slideRef.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'ease-out' });
  }, [active]);

  const pick = (i) => {
    setActive(i);
    setPlaying(false);
    setAnnounce(true);
  };

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      setAnnounce(true);
    } else {
      steps.current = 0;
      setPlaying(true);
      setAnnounce(false);
    }
  };

  const s = HERO_SLIDES[active];

  return (
    <div className="hero-rotator" role="region" aria-roledescription="carousel" aria-label="What you can study here">
      <div className="hero-rotator-controls">
        <button
          type="button"
          className="hero-rotator-play"
          onClick={togglePlay}
          aria-label={playing ? 'Pause the rotating headlines' : 'Play the rotating headlines'}
        >
          <span aria-hidden="true">{playing ? 'Pause' : 'Play'}</span>
        </button>
        <div className="hero-rotator-tabs" role="group" aria-label="Choose a study track">
          {HERO_SLIDES.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={`hero-rotator-tab${i === active ? ' is-active' : ''}`}
              aria-controls="hero-slide"
              aria-current={i === active ? 'true' : undefined}
              onClick={() => pick(i)}
            >
              {t.track}
            </button>
          ))}
        </div>
      </div>

      <div className="hero-slides">
        {/* Height keeper: every slide, invisible and out of the accessibility tree */}
        {HERO_SLIDES.map((t) => (
          <div key={t.id} className="hero-slide hero-slide-sizer" aria-hidden="true" inert="">
            <SlideBody s={t} Title="p" />
          </div>
        ))}
        <div
          id="hero-slide"
          ref={slideRef}
          className="hero-slide is-active"
          role="group"
          aria-roledescription="slide"
          aria-label={`${active + 1} of ${total}: ${s.track}`}
          aria-live={announce ? 'polite' : 'off'}
          data-track={s.id}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            // Focus moved elsewhere in this page: resume. Window lost focus (relatedTarget null and
            // the document no longer has focus): keep holding, so focus is still here on return.
            if (e.currentTarget.contains(e.relatedTarget)) return;
            if (e.relatedTarget === null && !document.hasFocus()) return;
            setFocused(false);
          }}
        >
          <SlideBody s={s} Title="h1" />
        </div>
      </div>
    </div>
  );
};

export default HeroRotator;
