import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { certifications } from './src/data/certifications.js'
import { COURSES, COURSE_PRICE, BUNDLE_PRICE } from './src/data/courses.js'
import { FAQ } from './src/data/faq.js'

const SITE = 'https://aws-study-flashcards-app.com'
const live = certifications.filter((c) => c.status === 'available')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const dollars = (price) => price.replace('$', '')

// Structured data: who we are, the site, every course we sell, and the FAQ.
function structuredData() {
  const org = { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Nico Tek Solutions', url: SITE, logo: `${SITE}/logo.png` }
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
      { '@type': 'WebSite', '@id': `${SITE}/#website`, name: 'AWS Study Hub', url: `${SITE}/`, publisher: { '@id': org['@id'] } },
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
      <p><a href="/terms.html">Terms of Service</a> · <a href="/privacy.html">Privacy Policy</a></p>
      <p>Not affiliated with Amazon Web Services. AWS and all related marks are trademarks of Amazon.com, Inc.</p>
    </div>
  `
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'crawlable-page',
      transformIndexHtml: (html) =>
        html
          .replace('</head>', `  <script type="application/ld+json">${JSON.stringify(structuredData()).replace(/</g, '\\u003c')}</script>\n  </head>`)
          .replace('<div id="root"></div>', `<div id="root">${staticPage()}</div>`),
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
})
