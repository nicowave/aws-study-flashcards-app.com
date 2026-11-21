import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { certifications } from './src/data/certifications.js'
import { COURSES, COURSE_PRICE, BUNDLE_PRICE } from './src/data/courses.js'
import { FAQ } from './src/data/faq.js'
import { GIS_PAGE, GIS_WHY, GIS_COURSES, GIS_FOR, GIS_DISCLAIMER } from './src/data/gis.js'
import { fileURLToPath } from 'node:url'

const SITE = 'https://aws-study-flashcards-app.com'
const live = certifications.filter((c) => c.status === 'available')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const dollars = (price) => price.replace('$', '')

// Structured data: who we are, the site, every course we sell, and the FAQ.
function structuredData() {
  // The maker is the firm nico-tek.com describes. Same @id and url as there, so search engines and AI answers
  // see one company behind both sites instead of two firms with the same name.
  const org = {
    '@type': 'Organization',
    '@id': 'https://nico-tek.com/#organization',
    name: 'Nico Tek Solutions',
    url: 'https://nico-tek.com/',
    logo: 'https://nico-tek.com/assets/nico-tek-icon-512.png',
    sameAs: ['https://nico-tek.com/study-hub'],
  }
  const course = ({ name, description, url, price, hours }) => ({
    '@type': 'Course',
    '@id': `${url}/#course`,
    name,
    description,
    url,
    provider: { '@id': org['@id'] },
    isAccessibleForFree: false,
    offers: { '@type': 'Offer', category: 'Paid', price: dollars(price), priceCurrency: 'USD', url },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', ...(hours && { courseWorkload: `PT${hours}H` }) },
  })
  const courses = [
    ...live.map((c) => course({
      name: `${c.name} (${c.code}) practice exam and flashcards`,
      description: `${c.description} Quiz game, flashcards, study guide and a ${c.questions.split(' ')[0]}-question, ${c.examLength.replace(' minutes', '-minute')} timed exam simulator.`,
      url: c.url,
      price: c.price,
    })),
    ...COURSES.map((c) => course({ name: c.title, description: c.blurb, url: c.url, price: COURSE_PRICE, hours: c.hours })),
  ]
  return {
    '@context': 'https://schema.org',
    '@graph': [
      org,
      { '@type': 'WebSite', '@id': `${SITE}/#website`, name: 'Level Up Study Hub', url: `${SITE}/`, publisher: { '@id': org['@id'] } },
      ...courses,
      {
        '@type': 'ItemList',
        name: 'AWS certification prep and coding courses',
        itemListElement: courses.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: c.url })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    ],
  }
}

// What crawlers that don't run JavaScript (most AI search bots, link previews)
// see. React replaces it on load; it uses the same words as the live page.
function staticPage() {
  const certItems = live.map((c) => `
        <li><a href="${c.url}"><strong>${esc(c.name)} (${c.code})</strong></a>: ${esc(c.description)}
          ${c.questions}, ${c.examLength}, pass mark ${c.passingScore}. One-time unlock ${c.price}.</li>`).join('')
  const courseItems = COURSES.map((c) => `
        <li><a href="${c.url}"><strong>${esc(c.title)}</strong></a>: ${esc(c.blurb)} ${c.tutorials} tutorials, about ${c.hours} hours. ${COURSE_PRICE} once.</li>`).join('')
  const faqItems = FAQ.map(({ q, a }) => `
        <h3>${esc(q)}</h3>
        <p>${esc(a)}</p>`).join('')
  return `
    <div class="static-page">
      <h1>Pass Your AWS Certification First Try</h1>
      <p>Exam-style practice questions, flashcards, and full-length timed exam simulators for AWS Cloud Practitioner,
        AI Practitioner, Solutions Architect – Associate, and Developer – Associate. Try it free, no account needed.</p>
      <h2>AWS Certifications</h2>
      <ul>${certItems}
      </ul>
      <h2>The Developer Path: coding courses</h2>
      <p>Four coding courses for IT people who have never scripted or built a web app, ending at the Developer Associate
        certification. Practice in your browser, then build it on your own AWS account. The first tutorial of every course is free.
        The Developer Path bundle (all four courses plus the Developer – Associate study game) is ${BUNDLE_PRICE} once.</p>
      <ul>${courseItems}
      </ul>
      <h2>Questions People Ask</h2>${faqItems}
      <p>Made by <a href="https://nico-tek.com/study-hub">Nico Tek Solutions</a> · <a href="/terms.html">Terms of Service</a> · <a href="/privacy.html">Privacy Policy</a></p>
      <p>Not affiliated with Amazon Web Services. AWS and all related marks are trademarks of Amazon.com, Inc.</p>
    </div>
  `
}

// The GIS track page (/gis/): structured data and the crawler copy, from src/data/gis.js.
function gisStructuredData() {
  const url = `${SITE}${GIS_PAGE.path}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: GIS_PAGE.title,
        description: GIS_PAGE.description,
        isPartOf: { '@id': `${SITE}/#website` },
        publisher: { '@id': 'https://nico-tek.com/#organization' },
      },
      {
        '@type': 'ItemList',
        name: 'GIS courses (coming soon)',
        itemListElement: GIS_COURSES.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.title, description: c.blurb })),
      },
    ],
  }
}

function staticGisPage() {
  const h = GIS_PAGE.headline
  const why = GIS_WHY.map((w) => `
        <li><strong>${esc(w.title)}</strong>: ${esc(w.text)}</li>`).join('')
  const courses = GIS_COURSES.map((c) => `
        <li><strong>${esc(c.title)}</strong> (${esc(c.level)}, coming soon): ${esc(c.blurb)} Tools: ${c.tools.map(esc).join(', ')}.</li>`).join('')
  const forList = GIS_FOR.map((f) => `
        <li>${esc(f)}</li>`).join('')
  return `
    <div class="static-page">
      <h1>${esc(h.before + h.highlight + h.after)}</h1>
      <p>${esc(GIS_PAGE.lede)}</p>
      <h2>Why GIS</h2>
      <ul>${why}
      </ul>
      <h2>The GIS Courses</h2>
      <ol>${courses}
      </ol>
      <h2>Who It Is For</h2>
      <ul>${forList}
      </ul>
      <p><a href="/">Level Up Study Hub home</a> · <a href="/#courses">Live coding courses</a></p>
      <p>${esc(GIS_DISCLAIMER)}</p>
      <p>Made by <a href="https://nico-tek.com/study-hub">Nico Tek Solutions</a> · <a href="/terms.html">Terms of Service</a> · <a href="/privacy.html">Privacy Policy</a></p>
    </div>
  `
}

const ldScript = (data) => `  <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>\n  </head>`

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'crawlable-page',
      // Each HTML entry gets its own structured data and crawler copy.
      transformIndexHtml: (html, ctx) => {
        const gis = /(^|\/)gis\/index\.html$/.test(ctx.filename || ctx.path || '')
        return html
          .replaceAll('%HUB_SITE%', SITE)
          .replace('</head>', ldScript(gis ? gisStructuredData() : structuredData()))
          .replace('<div id="root"></div>', `<div id="root">${gis ? staticGisPage() : staticPage()}</div>`)
      },
    },
  ],
  build: {
    rollupOptions: {
      // Two pages, one app: / (index.html) and /gis/ (gis/index.html, a folder page
      // the hub's S3 website origin serves at /gis/)
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        gis: fileURLToPath(new URL('./gis/index.html', import.meta.url)),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
})
