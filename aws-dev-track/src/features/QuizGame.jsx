import { useState } from 'react'
import { topics, getTopicById } from '../data/devTrackQuestions.js'
import { load, save, shuffle, withShuffledOptions } from './store.js'

const KEY = 'dev-track-quiz'
const RUN_LENGTH = 10
const XP_PER_LEVEL = 100
const INITIAL = { xp: 0, bestStreak: 0, answered: 0, correct: 0, best: {} } // best: topicId -> best % in a run

const levelOf = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1

function Stats({ s }) {
  const acc = s.answered ? Math.round((s.correct / s.answered) * 100) : 0
  return (
    <div className="q-stats" aria-label="Your progress">
      <div><span className="mono q-big">{levelOf(s.xp)}</span><span>Level</span></div>
      <div className="q-xp">
        <div className="q-bar" role="progressbar" aria-label="XP toward next level" aria-valuemin={0} aria-valuemax={XP_PER_LEVEL} aria-valuenow={s.xp % XP_PER_LEVEL}>
          <span style={{ width: `${s.xp % XP_PER_LEVEL}%` }} />
        </div>
        <span className="mono">{s.xp % XP_PER_LEVEL} / {XP_PER_LEVEL} XP</span>
      </div>
      <div><span className="mono q-big">{acc}%</span><span>Accuracy</span></div>
      <div><span className="mono q-big">{s.bestStreak}</span><span>Best streak</span></div>
    </div>
  )
}

export default function QuizGame() {
  const [stats, setStats] = useState(() => load(KEY, INITIAL))
  const [run, setRun] = useState(null) // { topicId, qs, i, picked, score, streak, xpGained }

  const start = (topicId) => {
    const qs = shuffle(getTopicById(topicId).questions).slice(0, RUN_LENGTH).map(withShuffledOptions)
    setRun({ topicId, qs, i: 0, picked: null, score: 0, streak: 0, xpGained: 0 })
  }

  const pick = (k) => {
    if (run.picked !== null) return
    const q = run.qs[run.i]
    const right = k === q.correctAnswer
    const streak = right ? run.streak + 1 : 0
    const gain = right ? 10 + (streak > 0 && streak % 3 === 0 ? 5 : 0) : 0
    const next = { ...stats, xp: stats.xp + gain, answered: stats.answered + 1, correct: stats.correct + (right ? 1 : 0), bestStreak: Math.max(stats.bestStreak, streak) }
    setStats(next); save(KEY, next)
    setRun({ ...run, picked: k, score: run.score + (right ? 1 : 0), streak, xpGained: run.xpGained + gain })
  }

  const advance = () => {
    if (run.i + 1 < run.qs.length) { setRun({ ...run, i: run.i + 1, picked: null }); return }
    const pct = Math.round((run.score / run.qs.length) * 100)
    const best = { ...stats.best, [run.topicId]: Math.max(stats.best[run.topicId] || 0, pct) }
    const next = { ...stats, best }
    setStats(next); save(KEY, next)
    setRun({ ...run, done: true, pct })
  }

  if (!run) {
    return (
      <section className="lab">
        <header><h2>Quiz game</h2><p className="lead">Pick a topic for a {RUN_LENGTH}-question run. +10 XP per right answer, +5 bonus on every third in a row.</p></header>
        <Stats s={stats} />
        <div className="q-topics">
          {topics.map(t => (
            <button key={t.id} className="q-topic" onClick={() => start(t.id)}>
              <strong>{t.title}</strong>
              <span className="mono">{t.questions.length} questions · best {stats.best[t.id] ?? '–'}{stats.best[t.id] !== undefined ? '%' : ''}</span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  const topic = getTopicById(run.topicId)
  if (run.done) {
    return (
      <section className="lab">
        <header><h2>{topic.title}: {run.score} / {run.qs.length}</h2><p className="lead">{run.pct >= 80 ? 'Strong run.' : run.pct >= 60 ? 'Getting there. Read the explanations you missed, then go again.' : 'Worth a pass through the study guide chapter, then retry.'} You earned {run.xpGained} XP.</p></header>
        <Stats s={stats} />
        <div className="row">
          <button className="btn" onClick={() => start(run.topicId)}>Play this topic again</button>
          <button className="btn secondary" onClick={() => setRun(null)}>All topics</button>
        </div>
      </section>
    )
  }

  const q = run.qs[run.i]
  const answered = run.picked !== null
  return (
    <section className="lab quiz">
      <div className="row q-head">
        <button className="btn secondary" onClick={() => setRun(null)}>Quit</button>
        <span className="mono">{topic.title} · {run.i + 1} / {run.qs.length} · streak {run.streak}</span>
      </div>
      <h3 className="q-question">{q.question}</h3>
      <div className="q-options" role="group" aria-label="Answer options">
        {q.options.map((o, k) => {
          const state = !answered ? '' : k === q.correctAnswer ? 'right' : k === run.picked ? 'wrong' : 'dim'
          return (
            <button key={k} className={`q-option ${state}`} onClick={() => pick(k)} disabled={answered} aria-pressed={run.picked === k}>
              <span className="mono">{String.fromCharCode(65 + k)}</span> {o}
            </button>
          )
        })}
      </div>
      <div aria-live="polite">
        {answered && (
          <div className={`q-feedback ${run.picked === q.correctAnswer ? 'right' : 'wrong'}`}>
            <strong>{run.picked === q.correctAnswer ? 'Correct.' : `Not quite. The answer is ${String.fromCharCode(65 + q.correctAnswer)}.`}</strong>
            <p>{q.explanation}</p>
          </div>
        )}
      </div>
      {answered && <div className="row"><button className="btn" onClick={advance} autoFocus>{run.i + 1 < run.qs.length ? 'Next question' : 'See results'}</button></div>}
    </section>
  )
}
