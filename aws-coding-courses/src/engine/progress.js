// Course progress: saved in this browser right away, and to the learner's
// account (StudyHub API, /v1/progress/<courseId>) when signed in.
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadProgress, saveProgress } from '../services/sharedAuth';

const EMPTY = { done: {}, quiz: {}, checklist: {} };
const storageKey = (courseId) => `awsCourse_${courseId}_progress`;

const readLocal = (courseId) => {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(storageKey(courseId)) || '{}') };
  } catch {
    return { ...EMPTY };
  }
};
const writeLocal = (courseId, p) => {
  try { localStorage.setItem(storageKey(courseId), JSON.stringify(p)); } catch { /* private mode */ }
};

// Union of finished steps; best quiz score; union of ticked checklist items
export const mergeProgress = (a, b) => {
  const quiz = { ...a.quiz };
  for (const [k, v] of Object.entries(b.quiz || {})) if (!quiz[k] || v.score > quiz[k].score) quiz[k] = v;
  const checklist = { ...a.checklist };
  for (const [k, v] of Object.entries(b.checklist || {})) checklist[k] = [...new Set([...(checklist[k] || []), ...v])];
  return { done: { ...(b.done || {}), ...a.done }, quiz, checklist };
};

export const stepKey = (tutorial, step) => `${tutorial.slug}/${step.id}`;

export function useProgress(courseId, user) {
  const [progress, setProgress] = useState(() => readLocal(courseId));
  const saveTimer = useRef(null);
  const signedIn = !!user;

  // Pull the account copy once signed in and merge it with this browser's
  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    loadProgress(courseId).then((remote) => {
      if (!live || !remote) return;
      setProgress((local) => {
        const merged = mergeProgress(local, remote);
        writeLocal(courseId, merged);
        return merged;
      });
    }).catch(() => {});
    return () => { live = false; };
  }, [courseId, signedIn]);

  const update = useCallback((fn) => {
    setProgress((prev) => {
      const next = fn(prev);
      writeLocal(courseId, next);
      if (signedIn) {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          saveProgress(courseId, { done: next.done, quiz: next.quiz, checklist: next.checklist }).catch(() => {});
        }, 1500);
      }
      return next;
    });
  }, [courseId, signedIn]);

  const markDone = useCallback((key) => update((p) => (p.done[key] ? p : { ...p, done: { ...p.done, [key]: Date.now() } })), [update]);
  const setQuiz = useCallback((key, score, total) => update((p) => ({ ...p, quiz: { ...p.quiz, [key]: { score, total } } })), [update]);
  const setChecklist = useCallback((key, items) => update((p) => ({ ...p, checklist: { ...p.checklist, [key]: items } })), [update]);

  return { progress, markDone, setQuiz, setChecklist };
}

export const tutorialStats = (tutorial, progress) => {
  const total = tutorial.steps.length;
  const done = tutorial.steps.filter((s) => progress.done[stepKey(tutorial, s)]).length;
  return { done, total, complete: total > 0 && done === total };
};
