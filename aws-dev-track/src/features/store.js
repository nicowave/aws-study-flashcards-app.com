// Tiny localStorage helpers for quiz progress and exam history. Every access is guarded:
// storage can be unavailable (private mode, blocked site data) and the app must still work.
export const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

export const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

// Fisher-Yates shuffle (returns a new array)
export const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Shuffle a question's options and remap correctAnswer, so position is never a tell
export const withShuffledOptions = (q) => {
  const order = shuffle(q.options.map((_, i) => i))
  return { ...q, options: order.map(i => q.options[i]), correctAnswer: order.indexOf(q.correctAnswer) }
}
