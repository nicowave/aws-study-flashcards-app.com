// The GIS track (page /gis/). Plain data, so the build (vite.config.js) can also
// read it for the page crawlers see. Every course is "coming soon": no prices and
// no dates until Tony sets them. Organisation names are plain text that describes
// the kind of work; no logos, and the page says we are not affiliated.
export const GIS_PAGE = {
  path: '/gis/',
  title: 'GIS Courses: Become a GIS Professional | Level Up Study Hub',
  description:
    'GIS courses coming soon to Level Up Study Hub: understand GIS, build open-source web maps, and use GIS in real estate, city work and international development. Free tools, real data, no prior GIS needed.',
  eyebrow: 'New track · Coming soon',
  headline: { before: 'Become a GIS Professional and Put Your Skills ', highlight: 'on the Map', after: '' },
  lede:
    'GIS (a geographic information system) is software that stores places and what is true about them, then turns that into maps that answer questions. These courses teach it with free, open-source tools and real public data, from your first map to a web map app you can show an employer.',
};

export const GIS_WHY = [
  {
    title: 'Maps that answer questions',
    text: 'Where should the clinic go? Which homes sit in a flood zone? GIS answers questions like these with data, not guesswork.',
  },
  {
    title: 'Free, open-source tools',
    text: 'QGIS on the desktop, PostGIS in the database, MapLibre and Leaflet on the web. No licence fees for you or your future employer.',
  },
  {
    title: 'Used in many fields',
    text: 'Real estate, city planning, utilities, insurance, public health and international development all hire people who can work with maps and data.',
  },
];

export const GIS_COURSES = [
  {
    id: 'understanding-gis',
    title: 'Understanding GIS',
    level: 'Beginner',
    blurb:
      'What GIS is and how it stores the world: points, lines, areas and grids, map projections and coordinate systems, and where to find free data. No code needed.',
    tools: ['QGIS', 'OpenStreetMap'],
  },
  {
    id: 'practical-gis',
    title: 'Practical GIS in the Real World',
    level: 'Beginner',
    blurb:
      'Answer real questions with maps: pick a store site, find who lives near a hazard, measure how far people travel to a service. Each lesson ends with a finished map.',
    tools: ['QGIS', 'Census data', 'OpenStreetMap'],
  },
  {
    id: 'open-source-web-gis',
    title: 'Building Open-Source GIS Web Apps',
    level: 'Intermediate',
    blurb:
      'Put your maps on the web: a database that understands places, map tiles that load fast, and a map page anyone can open on a phone. Some JavaScript helps.',
    tools: ['PostGIS', 'MapLibre GL JS', 'Leaflet', 'GeoJSON'],
  },
  {
    id: 'gis-real-estate',
    title: 'GIS for Real Estate',
    level: 'Beginner to intermediate',
    blurb:
      'Parcels, zoning, flood maps and recent sales on one map. Screen sites, spot risks early and show clients the reasons behind a recommendation.',
    tools: ['QGIS', 'County parcel data', 'Flood maps'],
  },
  {
    id: 'gis-international-development',
    title: 'GIS for International Development',
    level: 'Intermediate',
    blurb:
      'How development banks and NGOs use maps to plan projects and track results, for people who work with or want to join groups such as the World Bank, the IMF and the Inter-American Development Bank.',
    tools: ['QGIS', 'Open development data', 'Satellite imagery'],
  },
];

export const GIS_FOR = [
  'Career changers who want a map-and-data skill employers can see',
  'Analysts, planners and real estate people who already use spreadsheets',
  'Developers who want to add maps to the apps they build',
  'Students and NGO staff heading into development or public-sector work',
];

// Plain answers, including the two a reader could misread: "GIS professional" is a job,
// not the GISP credential, and nothing here promises a job or pay.
export const GIS_FAQ = [
  { q: 'Can I take a GIS course now?', a: 'Not yet. Every GIS course is coming soon, so there is nothing to buy today. Each course will appear on this page when it opens.' },
  { q: 'Do I need experience?', a: 'No. Understanding GIS starts from zero. Building Open-Source GIS Web Apps expects JavaScript basics, which our JavaScript course covers.' },
  { q: 'Which software will I use?', a: 'Mostly free, open-source tools: QGIS, PostGIS, MapLibre and Leaflet, with public data such as OpenStreetMap and census maps.' },
  { q: 'Do the GIS courses need AWS?', a: 'No. They stand on their own and are not part of the AWS courses.' },
  { q: 'Will this get me a job or a raise?', a: 'We cannot promise that. The courses teach skills and give you projects to show. Jobs and pay depend on many things we do not control.' },
  { q: 'Will finishing a course make me a certified GISP?', a: 'No. GISP is a credential that only the GIS Certification Institute (GISCI) awards, after its own exam and portfolio review. Our courses do not award any certification, and we are not affiliated with GISCI.' },
];

export const GIS_DISCLAIMER =
  'Not affiliated with or endorsed by the World Bank Group, the International Monetary Fund (IMF) or the Inter-American Development Bank (IDB). Their names only describe the kind of work these courses prepare you for. QGIS, PostGIS, MapLibre and Leaflet are open-source projects run by their own communities.';
