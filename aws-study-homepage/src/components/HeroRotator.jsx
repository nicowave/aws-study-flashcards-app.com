import React, { useEffect, useRef, useState } from 'react';
import { HERO_SLIDES } from '../data/heroSlides';
import { onThisName } from '../config/auth.config';
import { TargetIcon, CloudIcon, CodeIcon, ArrowRightIcon } from './Icons';

const ICONS = { target: TargetIcon, cloud: CloudIcon, code: CodeIcon, arrow: ArrowRightIcon };

// Rotating hero headlines: one slide per study track (AWS, GIS, Google Cloud, ...).
// Accessibility (WCAG 2.2.2 Pause, Stop, Hide): it moves on its own for at most a
// few rounds, never under prefers-reduced-motion, pauses while the pointer or keyboard
// focus is inside it, and has a Pause button plus one button per slide.
// Every slide stays in the page so the box keeps the height of the tallest one (no jump);
// the ones not showing are inert, so keyboards and screen readers skip them.
// Slide 1 (AWS) is the h1 and the same words as the static page in vite.config.js.

const ADVANCE_MS = 7000;
const MAX_ROUNDS = 3; // then it rests on the AWS slide, so the motion ends by itself

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const resolve = (href) => (href.startsWith('https://') ? onThisName(href) : href);

const HeroRotator = () => {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [announce, setAnnounce] = useState(false); // polite announcements only after a person picks a slide
  const steps = useRef(0);
  const total = HERO_SLIDES.length;

  // Auto-advance. Holds while hovered, focused or the tab is hidden.
  useEffect(() => {
    if (!playing || hovered || focused) return undefined;
    const id = window.setInterval(() => {
      if (document.hidden) return;
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

  const pick = (i) => {
    setActive(i);
    setPlaying(false);
    setAnnounce(true);
  };

  const togglePlay = () => {
    if (!playing) steps.current = 0;
    setPlaying((p) => !p);
    setAnnounce(playing); // pausing turns announcements on; playing turns them off
  };

  return (
    <div
      className="hero-rotator"
      role="region"
      aria-roledescription="carousel"
      aria-label="What you can study here"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}
    >
      <div className="hero-slides" aria-live={announce ? 'polite' : 'off'}>
        {HERO_SLIDES.map((s, i) => {
          const Title = i === 0 ? 'h1' : 'h2';
          const on = i === active;
          return (
            <div
              key={s.id}
              id={`hero-slide-${s.id}`}
              className={`hero-slide${on ? ' is-active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${total}: ${s.track}`}
              aria-hidden={!on}
              inert={on ? undefined : ''}
            >
              <div className={`hero-badge${s.soon ? ' hero-badge-soon' : ''}`}>
                <span className="badge-text mono">{s.badge}</span>
              </div>
              <Title className="hero-title">
                {s.before}<span className="highlight">{s.highlight}</span>{s.after}
              </Title>
              <p className="hero-subtitle">{s.subtitle}</p>
              <div className="hero-actions">
                {s.actions.map((a) => {
                  const Icon = ICONS[a.icon];
                  return (
                    <a key={a.label} href={resolve(a.href)} className={`btn ${a.primary ? 'btn-primary' : 'btn-secondary'}`}>
                      {Icon && <Icon size={20} />}
                      {a.label}
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

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
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`hero-rotator-tab${i === active ? ' is-active' : ''}`}
              aria-controls={`hero-slide-${s.id}`}
              aria-current={i === active ? 'true' : undefined}
              onClick={() => pick(i)}
            >
              {s.track}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroRotator;
