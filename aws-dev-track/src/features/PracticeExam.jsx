import { useEffect, useRef, useState } from 'react'
import { topics } from '../data/devTrackQuestions.js'
import { load, save, shuffle, withShuffledOptions } from './store.js'

const EXAM = { total: 40, minutes: 60, passPct: 70, historyKey: 'dev-track-exam-history' }

// Draw questions from every topic in proportion to its weight
function buildExam() {
  const weightSum = topics.reduce((a, t) => a + t.weight, 0)
  const counts = topics.map(t => Math.min(t.questions.length, Math.round((t.weight / weightSum) * EXAM.total)))
  let diff = EXAM.total - counts.reduce((a, b) => a + b, 0)
  for (let i = 0; diff !== 0 && i < 100; i++) {
    const k = i % topics.length
    if (diff > 0 && counts[k] < topics[k].questions.length) { counts[k]++; diff-- }
    else if (diff < 0 && counts[k] > 1) { counts[k]--; diff++ }
  }
  const qs = topics.flatMap((t, k) => shuffle(t.questions).slice(0, counts[k]).map(q => ({ ...withShuffledOptions(q), topicId: t.id, topicTitle: t.title })))
  return shuffle(qs)
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function PracticeExam() {
  const [phase, setPhase] = useState('intro') // intro | exam | result
  const [qs, setQs] = useState([])
  const [answers, setAnswers] = useState({})
  const [flags, setFlags] = useState({})
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(EXAM.minutes * 60)
  const [confirm, setConfirm] = useState(false)
  const [result, setResult] = useState(null)
  const [review, setReview] = useState(false)
  const history = useRef(load(EXAM.historyKey, { attempts: [] }))

  const begin = () => {
    setQs(buildExam()); setAnswers({}); setFlags({}); setI(0); setLeft(EXAM.minutes * 60)
    setConfirm(false); setResult(null); setReview(false); setPhase('exam')
  }

  const submit = () => {
    const byTopic = {}
    let correct = 0
    qs.forEach((q, k) => {
      const t = byTopic[q.topicId] || (byTopic[q.topicId] = { title: q.topicTitle, n: 0, right: 0 })
      t.n++
      if (answers[k] === q.correctAnswer) { t.right++; correct++ }
    })
    const pct = Math.round((correct / qs.length) * 100)
    const r = { correct, total: qs.length, pct, passed: pct >= EXAM.passPct, byTopic, usedSec: EXAM.minutes * 60 - left, at: Date.now() }
    history.current = { attempts: [...history.current.attempts, { pct: r.pct, at: r.at }].slice(-20) }
    save(EXAM.historyKey, history.current)
    setResult(r); setPhase('result')
  }

  // countdown; auto-submit at zero
  useEffect(() => {
    if (phase !== 'exam') return
    if (left <= 0) { submit(); return }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, left]) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'intro') {
    const last = history.current.attempts.slice(-3).reverse()
    return (
      <section className="lab">
        <header><h2>Practice exam</h2><p className="lead">{EXAM.total} questions drawn from all seven topics by weight, a {EXAM.minutes}-minute countdown that submits at zero, and {EXAM.passPct}% to pass. No feedback until you submit; you can flag questions and change answers until then.</p></header>
        {last.length > 0 && <p className="mono">Recent: {last.map(a => `${a.pct}%`).join(' · ')}</p>}
        <div className="row"><button className="btn" onClick={begin}>Start exam</button></div>
      </section>
    )
  }

  if (phase === 'result') {
    const weakest = Object.entries(result.byTopic).sort((a, b) => a[1].right / a[1].n - b[1].right / b[1].n)[0]
    return (
      <section className="lab">
        <header>
          <h2>{result.passed ? 'Pass' : 'Not yet'}: {result.pct}% ({result.correct} / {result.total})</h2>
          <p className="lead">Pass line {EXAM.passPct}% · time used {fmt(result.usedSec)}{weakest ? ` · weakest topic: ${weakest[1].title}` : ''}</p>
        </header>
        <h3>By topic</h3>
        <ul className="x-breakdown">
          {Object.entries(result.byTopic).map(([id, t]) => {
            const p = Math.round((t.right / t.n) * 100)
            return (
              <li key={id}>
                <span>{t.title}</span>
                <span className="q-bar" role="img" aria-label={`${p} percent`}><span style={{ width: `${p}%` }} /></span>
                <span className="mono">{t.right}/{t.n}</span>
              </li>
            )
          })}
        </ul>
        <div className="row">
          <button className="btn secondary" onClick={() => setReview(r => !r)}>{review ? 'Hide answers' : 'Review answers'}</button>
          <button className="btn" onClick={begin}>Retake exam</button>
          <button className="btn secondary" onClick={() => setPhase('intro')}>Back</button>
        </div>
        {review && (
          <ol className="x-review">
            {qs.map((q, k) => {
              const ok = answers[k] === q.correctAnswer
              return (
                <li key={k} className={ok ? 'right' : 'wrong'}>
                  <p><strong>{q.question}</strong></p>
                  <p>Your answer: {answers[k] !== undefined ? q.options[answers[k]] : 'none'} {ok ? '(correct)' : ''}</p>
                  {!ok && <p>Correct: {q.options[q.correctAnswer]}</p>}
                  <p className="x-expl">{q.explanation}</p>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    )
  }

  const q = qs[i]
  const unanswered = qs.length - Object.keys(answers).length
  return (
    <section className="lab quiz">
      <div className="row q-head">
        <span className="mono" aria-live="off">Question {i + 1} of {qs.length}</span>
        <span className={`mono x-timer ${left < 300 ? 'low' : ''}`} role="timer" aria-label="Time left">{fmt(left)}</span>
        <span className="mono">{qs.length - unanswered} answered</span>
      </div>
      <nav className="x-grid" aria-label="Jump to question">
        {qs.map((_, k) => (
          <button key={k} className={`${k === i ? 'cur' : ''} ${answers[k] !== undefined ? 'done' : ''} ${flags[k] ? 'flag' : ''}`} onClick={() => setI(k)} aria-label={`Question ${k + 1}${answers[k] !== undefined ? ', answered' : ''}${flags[k] ? ', flagged' : ''}`}>{k + 1}</button>
        ))}
      </nav>
      <h3 className="q-question">{q.question}</h3>
      <div className="q-options" role="radiogroup" aria-label="Answer options">
        {q.options.map((o, k) => (
          <button key={k} role="radio" aria-checked={answers[i] === k} className={`q-option ${answers[i] === k ? 'chosen' : ''}`} onClick={() => setAnswers(a => ({ ...a, [i]: k }))}>
            <span className="mono">{String.fromCharCode(65 + k)}</span> {o}
          </button>
        ))}
      </div>
      <div className="row">
        <button className="btn secondary" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button>
        <button className="btn secondary" onClick={() => setFlags(f => ({ ...f, [i]: !f[i] }))} aria-pressed={!!flags[i]}>{flags[i] ? 'Unflag' : 'Flag for review'}</button>
        <button className="btn secondary" disabled={i === qs.length - 1} onClick={() => setI(i + 1)}>Next</button>
        <button className="btn" onClick={() => setConfirm(true)}>Submit exam</button>
      </div>
      {confirm && (
        <div className="x-confirm" role="alertdialog" aria-label="Submit the exam?">
          <p>{unanswered > 0 ? `${unanswered} question${unanswered === 1 ? ' is' : 's are'} unanswered and will count as wrong.` : 'All questions answered.'} Submit now?</p>
          <div className="row">
            <button className="btn" onClick={submit} autoFocus>Yes, submit</button>
            <button className="btn secondary" onClick={() => setConfirm(false)}>Keep going</button>
          </div>
        </div>
      )}
    </section>
  )
}
