import { useState } from 'react'
import { chapters, getChapterById } from '../data/devTrackGuide.js'

// Renders one content block of a guide section. Block types match the AWS Study Hub guides, plus `code`.
function Block({ b }) {
  switch (b.type) {
    case 'paragraph':
      return <p>{b.text}</p>
    case 'keyTerm':
      return <div className="g-term"><dt>{b.term}</dt><dd>{b.definition}</dd></div>
    case 'awsService':
      return <div className="g-service"><strong>{b.name}</strong><p>{b.description}</p></div>
    case 'table':
      return (
        <div className="g-table-wrap" role="region" aria-label="Table" tabIndex={0}>
          <table className="g-table">
            <thead><tr>{b.headers.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )
    case 'comparison':
      return (
        <div className="g-compare">
          {b.title && <h4>{b.title}</h4>}
          <div className="g-compare-grid">{b.items.map(it => <div key={it.label}><strong>{it.label}</strong><p>{it.description}</p></div>)}</div>
        </div>
      )
    case 'bulletList':
      return <div>{b.title && <h4>{b.title}</h4>}<ul>{b.items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
    case 'numberedList':
      return <div>{b.title && <h4>{b.title}</h4>}<ol>{b.items.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
    case 'code':
      return <div>{b.title && <h4>{b.title}</h4>}<pre>{b.text}</pre></div>
    case 'examTip':
      return <aside className="g-tip"><strong>Tip</strong> {b.text}</aside>
    default:
      return null
  }
}

export default function StudyGuide() {
  const [id, setId] = useState(null)
  const chapter = id ? getChapterById(id) : null

  if (!chapter) {
    return (
      <section className="lab">
        <header><h2>Study guide</h2><p className="lead">One chapter per topic. Read it, then try the matching lab and quiz.</p></header>
        <ol className="g-chapters">
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button className="g-chapter" onClick={() => setId(c.id)}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                <span><strong>{c.title}</strong><br /><span className="g-summary">{c.summary}</span></span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    )
  }

  const idx = chapters.findIndex(c => c.id === chapter.id)
  return (
    <section className="lab guide-chapter">
      <div className="row">
        <button className="btn secondary" onClick={() => setId(null)}>All chapters</button>
        <span className="mono g-count">Chapter {idx + 1} of {chapters.length}</span>
      </div>
      <header><h2>{chapter.title}</h2><p className="lead">{chapter.summary}</p></header>
      <nav aria-label="Sections in this chapter" className="g-toc">
        {chapter.sections.map(s => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
      </nav>
      {chapter.sections.map(s => (
        <article key={s.id} id={s.id} className="g-section">
          <h3>{s.title}</h3>
          <dl className="g-blocks">{s.content.map((b, i) => <Block key={i} b={b} />)}</dl>
        </article>
      ))}
      <div className="row">
        <button className="btn secondary" disabled={idx === 0} onClick={() => { setId(chapters[idx - 1].id); window.scrollTo(0, 0) }}>Previous chapter</button>
        <button className="btn" disabled={idx === chapters.length - 1} onClick={() => { setId(chapters[idx + 1].id); window.scrollTo(0, 0) }}>Next chapter</button>
      </div>
    </section>
  )
}
