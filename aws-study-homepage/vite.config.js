import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { certifications } from './src/data/certifications.js'
import { COURSES, OTHER_COURSES } from './src/data/courses.js'
import { PRODUCT_MONTHLY, PRODUCT_YEARLY, PRO_YEARLY, PRO_TRIAL_DAYS } from './src/data/prices.js'
import { FAQ } from './src/data/faq.js'
import { GIS_PAGE, GIS_WHY, GIS_COURSES, GIS_FOR, GIS_FAQ, GIS_DISCLAIMER } from './src/data/gis.js'
import { fileURLToPath } from 'node:url'

const SITE = 'https://levelupstudyhub.com'
const live = certifications.filter((c) => c.status === 'available')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const dollars = (price) => price.replace('$', '')
// Words for the crawler copy, same as the live cards
const PRODUCT_PRICE_TEXT = `${PRODUCT_MONTHLY} a month or ${PRODUCT_YEARLY} a year`

// Every certification and course is a subscription, monthly or yearly: one Offer with a
// price per billing period (schema.org UnitPriceSpecification; P1M / P1Y are ISO 8601 durations).
const subscriptionOffer = (url) => ({
  '@type': 'Offer',
  category: 'Subscription',
  price: dollars(PRODUCT_MONTHLY),
  priceCurrency: 'USD',
  url,
  priceSpecification: [
    { '@type': 'UnitPriceSpecification', price: dollars(PRODUCT_MONTHLY), priceCurrency: 'USD', billingDuration: 'P1M' },
    { '@type': 'UnitPriceSpecification', price: dollars(PRODUCT_YEARLY), priceCurrency: 'USD', billingDuration: 'P1Y' },
  ],
})

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
  const course = ({ name, description, url, hours }) => ({
    '@type': 'Course',
    '@id': `${url}/#course`,
    name,
    description,
    url,
    provider: { '@id': org['@id'] },
    isAccessibleForFree: false,
    offers: subscriptionOffer(url),
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', ...(hours && { courseWorkload: `PT${hours}H` }) },
  })
  const courses = [
    ...live.map((c) => course({
      name: `${c.name} (${c.code}) practice exam and flashcards`,
      description: `${c.description} Quiz game, flashcards, study guide and a ${c.questions.split(' ')[0]}-question, ${c.examLength.replace(' minutes', '-minute')} timed exam simulator.`,
      url: c.url,
    })),
    ...COURSES.map((c) => course({ name: c.title, description: c.blurb, url: c.url, hours: c.hours })),
    // Only live sites: crawlers shouldn't be sent to an address that doesn't answer yet
    ...OTHER_COURSES.filter((c) => c.live).map((c) => course({ name: c.title, description: c.blurb, url: c.url, hours: c.hours })),
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

// More courses, once their site is live
function otherCourses() {
  const items = OTHER_COURSES.filter((c) => c.live).map((c) => `
        <li><a href="${c.url}"><strong>${esc(c.title)}</strong></a>: ${esc(c.blurb)} ${c.modules} modules, about ${c.hours} hours. ${PRODUCT_PRICE_TEXT}.</li>`).join('')
  return items ? `
      <h2>More courses</h2>
      <ul>${items}
      </ul>` : ''
}

// What crawlers that don't run JavaScript (most AI search bots, link previews)
// see. React replaces it on load; it uses the same words as the live page.
function staticPage() {
  const certItems = live.map((c) => `
        <li><a href="${c.url}"><strong>${esc(c.name)} (${c.code})</strong></a>: ${esc(c.description)}
          ${c.questions}, ${c.examLength}, pass mark ${c.passingScore}. ${PRODUCT_PRICE_TEXT}.</li>`).join('')
  const courseItems = COURSES.map((c) => `
        <li><a href="${c.url}"><strong>${esc(c.title)}</strong></a>: ${esc(c.blurb)} ${c.tutorials} tutorials, about ${c.hours} hours. ${PRODUCT_PRICE_TEXT}.</li>`).join('')
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
      <h2>Coding courses</h2>
      <p>Four coding courses for IT people who have never scripted or built a web app, ending at the Developer Associate
        certification. Practice in your browser, then build it on your own AWS account. The first tutorial of every course is free.</p>
      <ul>${courseItems}
      </ul>${otherCourses()}
      <h2>Plans</h2>
      <p>Start free with no account. Each certification and each coding course is ${PRODUCT_PRICE_TEXT}. Pro unlocks every
        certification and every coding course for ${PRO_YEARLY} a year, with a ${PRO_TRIAL_DAYS}-day free trial for first-time members. Subscriptions
        renew automatically; cancel anytime. Prices are in US dollars.</p>
      <h2>New: GIS courses</h2>
      <p><a href="/gis/">GIS courses (coming soon)</a>: understand GIS, build open-source web maps, and use GIS in real estate and international development.</p>
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
      <h2>Questions People Ask</h2>${GIS_FAQ.map(({ q, a }) => `
      <h3>${esc(q)}</h3>
      <p>${esc(a)}</p>`).join('')}
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
  // Tests run in jsdom, a simulated browser, so components can render without a real one
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
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
