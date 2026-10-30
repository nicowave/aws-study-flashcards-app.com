// Tutorial 1 (free): a flashcard page that flips cards, keeps score and
// remembers progress in the browser.
//
// Shared with TypeScript tutorial 1, which converts this page: cards are
// { id, front, back, hint, tags, difficulty }, the state is
// { index, known: [ids], unknown: [ids] } saved as JSON under the
// localStorage key 'flashcards-progress', the files are index.html,
// style.css and app.js (a classic script), and the page has #card (class
// "flipped" while the back shows), #front-text, #back-text, #tags, #score,
// and the buttons #flip, #know, #again and #reset.

export const DECK = [
  { id: 's3-bucket', front: 'What does Amazon S3 store?', back: 'Objects (files) in buckets', hint: 'S3 is short for Simple Storage Service', tags: ['storage', 's3'], difficulty: 'easy' },
  { id: 'lambda-what', front: 'Which service runs your code without servers to manage?', back: 'AWS Lambda', hint: 'You pay per request and per millisecond', tags: ['compute', 'serverless'], difficulty: 'easy' },
  { id: 'dynamodb-key', front: 'What must every item in a DynamoDB table have?', back: 'Its primary key: a partition key, plus a sort key if the table has one', hint: 'Think of the table\'s key schema', tags: ['database', 'dynamodb'], difficulty: 'medium' },
  { id: 'iam-least', front: 'What is the principle of least privilege?', back: 'Give each user or role only the permissions it needs, and nothing more', hint: 'An IAM best practice', tags: ['security', 'iam'], difficulty: 'easy' },
  { id: 'cloudfront-cache', front: 'What does Amazon CloudFront do for a website?', back: 'Keeps copies at edge locations close to visitors, so pages load faster', hint: 'A content delivery network', tags: ['networking', 'cloudfront'], difficulty: 'easy' },
  { id: 'sqs-dlq', front: 'Where does an Amazon SQS message go after failing too many times?', back: 'To a dead-letter queue, if the queue has one', hint: 'The redrive policy decides', tags: ['messaging', 'sqs'], difficulty: 'medium' },
  { id: 'region-az', front: 'How is a Region different from an Availability Zone?', back: 'A Region is a geographic area. It holds several Availability Zones: separate groups of data centers', hint: 'One contains the other', tags: ['infrastructure'], difficulty: 'easy' },
  { id: 'cognito-pool', front: 'What does an Amazon Cognito user pool give your app?', back: 'Sign-up and sign-in for its users, with tokens your API can check', hint: 'Users, passwords, tokens', tags: ['security', 'cognito'], difficulty: 'hard' },
];

// The deck as JavaScript source: single quotes, one card per line
const js = (v) => (Array.isArray(v) ? `[${v.map(js).join(', ')}]` : `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`);
const deckCode = () => `const deck = [\n${DECK.map((c) => `  { ${Object.entries(c).map(([k, v]) => `${k}: ${js(v)}`).join(', ')} },`).join('\n')}\n];`;

const scoreFor = (known, unknown) => `${known.length} known · ${unknown.length} to review`;

// ---------------------------------------------------------------------------
// The page: the HTML and CSS stay the same in every step; app.js grows
// ---------------------------------------------------------------------------

export const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AWS flashcards</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <h1>AWS flashcards</h1>
    <p id="score">0 known · 0 to review</p>

    <div id="card">
      <p id="front-text"></p>
      <p id="back-text"></p>
    </div>
    <ul id="tags"></ul>

    <div class="buttons">
      <button id="flip">Flip</button>
      <button id="know">I knew it</button>
      <button id="again">Again</button>
    </div>
    <button id="reset" class="quiet">Start over</button>
    <p class="keys">Keyboard: Space flips, → I knew it, ← again</p>
  </main>
  <script src="app.js"></script>
</body>
</html>`;

export const PAGE_CSS = `body {
  font-family: system-ui, sans-serif;
  background: #f4f1ea;
  color: #1d2430;
  margin: 0;
  padding: 24px 16px;
}
main { max-width: 32rem; margin: 0 auto; }
h1 { font-size: 1.4rem; margin: 0 0 4px; }
#score { color: #5b6472; margin: 0 0 16px; }

#card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 0.08);
  padding: 28px 22px;
  min-height: 140px;
}
#front-text { font-size: 1.25rem; font-weight: 600; margin: 0; }
#back-text { display: none; margin: 16px 0 0; color: #0b6e4f; font-size: 1.1rem; }
#card.flipped #back-text { display: block; }

#tags { list-style: none; display: flex; gap: 6px; padding: 0; margin: 12px 0; }
#tags li { background: #e3ddd0; border-radius: 999px; padding: 2px 10px; font-size: 0.8rem; }

.buttons { display: flex; gap: 8px; margin: 16px 0 8px; }
button { font: inherit; padding: 8px 16px; border-radius: 8px; border: 1px solid #1d2430; background: white; cursor: pointer; }
#know { background: #0b6e4f; border-color: #0b6e4f; color: white; }
button.quiet { border: 0; background: none; text-decoration: underline; padding: 0; color: #5b6472; }
.keys { color: #5b6472; font-size: 0.85rem; }`;

const files = (app) => [
  { path: 'app.js', starter: app },
  { path: 'index.html', starter: PAGE_HTML },
  { path: 'style.css', starter: PAGE_CSS },
];

// ---------------------------------------------------------------------------
// app.js, one piece at a time
// ---------------------------------------------------------------------------

const HELLO_APP = `// app.js: the page's behavior. For now, two lines.
console.log('Hello from app.js');
document.querySelector('#front-text').textContent = 'Your first card will go here';
`;

const FUNCTIONS = `// "3 known · 1 to review"
function scoreText(known, unknown) {
  return \`\${known.length} known · \${unknown.length} to review\`;
}

// The card after this one; after the last card, back to the first
function nextIndex(index, total) {
  return (index + 1) % total;
}

// The cards with this difficulty, like cardsAt('easy')
const cardsAt = (level) => deck.filter((card) => card.difficulty === level);`;

const FUNCTIONS_STARTER = `// app.js: small functions the page will use. Run the page to see the console.
${deckCode()}

// "3 known · 1 to review"
function scoreText(known, unknown) {
  // TODO: return the text, built from known.length and unknown.length
  return '';
}

// The card after this one; after the last card, back to the first
function nextIndex(index, total) {
  // TODO: add 1, but go back to 0 after the last card
  return index;
}

// The cards with this difficulty, like cardsAt('easy')
const cardsAt = (level) => {
  // TODO: return deck.filter(...) with only the cards of that difficulty
  return [];
};

console.log(scoreText(['s3-bucket', 'lambda-what'], ['iam-least']));
console.log(nextIndex(2, deck.length), nextIndex(7, deck.length));
console.log(cardsAt('hard').map((card) => card.front));
`;

const FUNCTIONS_SOLUTION = `// app.js: small functions the page will use. Run the page to see the console.
${deckCode()}

${FUNCTIONS}

console.log(scoreText(['s3-bucket', 'lambda-what'], ['iam-least']));
console.log(nextIndex(2, deck.length), nextIndex(7, deck.length));
console.log(cardsAt('hard').map((card) => card.front));`;

const RENDER = `// Show the current card, its tags and the score
function render() {
  const card = deck[state.index];
  document.querySelector('#front-text').textContent = card.front;
  document.querySelector('#back-text').textContent = card.back;
  document.querySelector('#card').classList.remove('flipped');
  document.querySelector('#score').textContent = scoreText(state.known, state.unknown);

  const tags = document.querySelector('#tags');
  tags.textContent = '';
  for (const tag of card.tags) {
    const li = document.createElement('li');
    li.textContent = tag;
    tags.append(li);
  }
}`;

const SHOW_HEAD = `// app.js: show one card at a time.
${deckCode()}

${FUNCTIONS}

let state = { index: 0, known: [], unknown: [] };
`;

const SHOW_STARTER = `${SHOW_HEAD}
// Show the current card, its tags and the score
function render() {
  const card = deck[state.index];
  document.querySelector('#front-text').textContent = card.front;
  // TODO: put card.back into #back-text
  // TODO: put the score text into #score (use scoreText)
  // TODO: for each of card.tags, create an <li>, set its text, and append it to #tags.
  //       Empty #tags first (tags.textContent = ''), so tags don't pile up.
}

render();
`;

const SHOW_SOLUTION = `${SHOW_HEAD}
${RENDER}

render();`;

const ANSWER = `// Turn the card over, or back again
function flip() {
  document.querySelector('#card').classList.toggle('flipped');
}

// Record an answer for the current card, then move on to the next one
function answer(knewIt) {
  const id = deck[state.index].id;
  state.known = state.known.filter((x) => x !== id);
  state.unknown = state.unknown.filter((x) => x !== id);
  if (knewIt) {
    state.known.push(id);
  } else {
    state.unknown.push(id);
  }
  state.index = nextIndex(state.index, deck.length);
  save();
  render();
}`;

const LISTENERS = `document.querySelector('#flip').addEventListener('click', flip);
document.querySelector('#know').addEventListener('click', () => answer(true));
document.querySelector('#again').addEventListener('click', () => answer(false));

document.addEventListener('keydown', (event) => {
  if (event.key === ' ') {
    event.preventDefault(); // stop Space from scrolling the page or pressing a button
    flip();
  } else if (event.key === 'ArrowRight') {
    answer(true);
  } else if (event.key === 'ArrowLeft') {
    answer(false);
  }
});`;

const EVENTS_HEAD = `// app.js: flip cards and keep score.
${deckCode()}

${FUNCTIONS}

let state = { index: 0, known: [], unknown: [] };

// Saving comes in the next step
function save() {}

${RENDER}
`;

const EVENTS_STARTER = `${EVENTS_HEAD}
// Turn the card over, or back again
function flip() {
  // TODO: toggle the class "flipped" on #card
}

// Record an answer for the current card, then move on to the next one
function answer(knewIt) {
  const id = deck[state.index].id;
  // TODO: take the id out of both lists, then push it onto state.known
  //       (knewIt is true) or state.unknown (knewIt is false)
  // TODO: move to the next card with nextIndex, then save() and render()
}

// TODO: clicking #flip calls flip; #know calls answer(true); #again answer(false)

// TODO: keyboard: Space flips (call event.preventDefault() too),
//       ArrowRight is answer(true), ArrowLeft is answer(false)

render();
`;

const EVENTS_SOLUTION = `${EVENTS_HEAD}
${ANSWER}

${LISTENERS}

render();`;

const STORAGE_HEAD = `// app.js: AWS flashcards that flip, keep score and remember your progress.
${deckCode()}

const STORAGE_KEY = 'flashcards-progress';
const freshState = () => ({ index: 0, known: [], unknown: [] });

${FUNCTIONS}
`;

const STORAGE_TAIL = `${RENDER}

${ANSWER}

${LISTENERS}

document.querySelector('#reset').addEventListener('click', () => {
  state = freshState();
  localStorage.removeItem(STORAGE_KEY);
  render();
});

let state = load();
render();`;

const STORAGE_STARTER = `${STORAGE_HEAD}
// Read the saved progress, or start fresh
function load() {
  // TODO: get the text saved under STORAGE_KEY with localStorage.getItem.
  //       null means nothing saved yet: return freshState().
  //       Otherwise JSON.parse it, inside try/catch: broken text also gives freshState().
  return freshState();
}

// Save the progress as JSON text
function save() {
  // TODO: localStorage.setItem(STORAGE_KEY, JSON.stringify(...))
}

${STORAGE_TAIL}
`;

export const APP_SOLUTION = `${STORAGE_HEAD}
// Read the saved progress, or start fresh
function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === null) return freshState();
  try {
    return JSON.parse(saved);
  } catch {
    return freshState(); // someone (or something) saved text that isn't JSON
  }
}

// Save the progress as JSON text
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

${STORAGE_TAIL}`;

// ---------------------------------------------------------------------------
// Probes: they click the learner's real page, so each one puts the saved
// progress and the page back the way it found them.
// ---------------------------------------------------------------------------

const withRestore = (body) => `const saved = practice.storage();
try {
${body}
} finally {
  localStorage.clear();
  for (const [k, v] of Object.entries(saved)) localStorage.setItem(k, v);
  try { state = typeof load === 'function' ? load() : { index: 0, known: [], unknown: [] }; render(); } catch (e) { /* not built yet */ }
}`;

const FLIP_PROBE = withRestore(`  const flipped = () => practice.$('#card').classList.contains('flipped');
  const look = () => ({ front: practice.text('#front-text'), score: practice.text('#score'), flipped: flipped() });
  const start = look();
  await practice.click('#flip');
  const afterFlip = flipped();
  await practice.click('#flip');
  const afterSecondFlip = flipped();
  await practice.click('#flip');
  await practice.click('#know');
  const afterKnow = look();
  await practice.click('#again');
  const afterAgain = look();
  await practice.key(' ');
  const afterSpace = flipped();
  await practice.key('ArrowRight');
  const afterRight = look();
  await practice.key('ArrowLeft');
  const afterLeft = look();
  for (let i = 0; i < 5; i++) await practice.click('#know');
  const wrapped = look();
  return { start, afterFlip, afterSecondFlip, afterKnow, afterAgain, afterSpace, afterRight, afterLeft, wrapped };`);

const REMEMBER_PROBE = withRestore(`  const before = saved['flashcards-progress'] ?? null;
  const shown = { front: practice.text('#front-text'), score: practice.text('#score') };
  await practice.click('#know');
  const afterKnow = localStorage.getItem('flashcards-progress');
  await practice.click('#reset');
  const afterReset = { front: practice.text('#front-text'), score: practice.text('#score'), stored: localStorage.getItem('flashcards-progress') };
  let fallback = null;
  if (typeof load === 'function') {
    localStorage.setItem('flashcards-progress', '{oops');
    try { fallback = load(); } catch (e) { fallback = { error: e.name }; }
  }
  return { before, shown, afterKnow, afterReset, fallback };`);

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

const pageBroken = (result) => (result.errors.length ? 'The page has an error: see the console below the preview.' : null);

const checkFunctions = ({ result, probe, probeError }) => {
  if (result.errors.length) return null;
  if (probeError || !probe) return null;
  if (probe.score === '' && probe.next[0] === 0 && !probe.hard.length) return null; // the untouched starter
  if (probe.score !== '3 known · 1 to review' || probe.empty !== '0 known · 0 to review') {
    return `scoreText(['a', 'b', 'c'], ['d']) gives ${JSON.stringify(probe.score)}. It should be "3 known · 1 to review": a template literal with known.length and unknown.length.`;
  }
  if (probe.next[0] !== 1 || probe.next[1] !== 0) {
    return `nextIndex(0, 8) gives ${probe.next[0]} and nextIndex(7, 8) gives ${probe.next[1]}: they should be 1 and 0. The remainder operator % wraps around: (index + 1) % total.`;
  }
  const hard = DECK.filter((c) => c.difficulty === 'hard').map((c) => c.id);
  const easy = DECK.filter((c) => c.difficulty === 'easy').length;
  if (JSON.stringify(probe.hard) !== JSON.stringify(hard) || probe.easy !== easy) {
    return 'cardsAt(level) should return only the cards whose difficulty is that level: deck.filter((card) => card.difficulty === level).';
  }
  return true;
};

const checkShow = ({ result, probe, probeError }) => {
  if (pageBroken(result)) return pageBroken(result);
  if (probeError || !probe) return null;
  const [first, fourth] = [DECK[0], DECK[3]];
  if (probe.front !== first.front) return null;
  if (probe.back !== first.back) return 'The front shows. Now put card.back into #back-text (it stays hidden until the card is flipped).';
  if (probe.score !== '0 known · 0 to review') return `#score shows "${probe.score}". Set its textContent to scoreText(state.known, state.unknown).`;
  if (JSON.stringify(probe.tags) !== JSON.stringify(first.tags)) return `#tags should list ${first.tags.join(' and ')}, one <li> each. It has: ${JSON.stringify(probe.tags)}.`;
  if (JSON.stringify(probe.tags4) !== JSON.stringify(fourth.tags) || probe.front4 !== fourth.front) {
    return `After moving to another card, #tags shows ${JSON.stringify(probe.tags4)}. Empty #tags at the start of render(), so old tags don't pile up.`;
  }
  return true;
};

const checkFlip = ({ result, probe, probeError }) => {
  if (pageBroken(result)) return pageBroken(result);
  if (probeError || !probe) return null;
  const { start, afterFlip, afterSecondFlip, afterKnow, afterAgain, afterSpace, afterRight, afterLeft, wrapped } = probe;
  if (!afterFlip && afterKnow.front === start.front) return null; // nothing wired up yet
  if (!afterFlip) return 'Clicking Flip doesn\'t add the class "flipped" to #card yet.';
  if (afterSecondFlip) return 'Flip should turn the card back over on a second click: use classList.toggle.';
  if (afterKnow.front !== DECK[1].front) return '"I knew it" should move on to the next card: state.index = nextIndex(...), then render().';
  if (afterKnow.score !== '1 known · 0 to review') return `After "I knew it" the score says "${afterKnow.score}". Push the id onto state.known before render().`;
  if (afterKnow.flipped) return 'The next card should start face up: render() removes the class "flipped".';
  if (afterAgain.score !== '1 known · 1 to review' || afterAgain.front !== DECK[2].front) return '"Again" should push the id onto state.unknown and move to the next card.';
  if (!afterSpace) return 'Space should flip the card: listen for keydown on document and check event.key === \' \'.';
  if (afterRight.score !== '2 known · 1 to review' || afterLeft.score !== '2 known · 2 to review') return 'The arrow keys should answer: ArrowRight is answer(true), ArrowLeft is answer(false).';
  if (wrapped.front !== DECK[1].front) return 'After the last card, the deck should start again from the first one.';
  // By now: 6 cards known, 2 to review, with the first card answered twice
  if (wrapped.score !== '6 known · 2 to review') {
    return `After going round the whole deck the score says "${wrapped.score}", but it should be "6 known · 2 to review": the first card was answered twice. Take the id out of both lists before pushing it, so a card is never counted twice.`;
  }
  return true;
};

const checkRemember = ({ result, probe, probeError }) => {
  if (pageBroken(result)) return pageBroken(result);
  if (probeError || !probe) return null;
  let before = null;
  try { before = JSON.parse(probe.before); } catch { /* not JSON */ }
  const start = before && Number.isInteger(before.index) && Array.isArray(before.known) && Array.isArray(before.unknown)
    ? before : { index: 0, known: [], unknown: [] };
  if (probe.afterKnow === probe.before) return null; // nothing saved yet
  if (probe.shown.front !== DECK[start.index]?.front || probe.shown.score !== scoreFor(start.known, start.unknown)) {
    return 'Saving works. Now load it: when the page opens, load() should read the saved progress, so the page shows the same card and score as before.';
  }
  let saved = null;
  try { saved = JSON.parse(probe.afterKnow); } catch { /* not JSON */ }
  const id = DECK[start.index].id;
  const known = [...start.known.filter((x) => x !== id), id];
  const unknown = start.unknown.filter((x) => x !== id);
  const want = { index: (start.index + 1) % DECK.length, known, unknown };
  if (!saved || saved.index !== want.index || JSON.stringify(saved.known) !== JSON.stringify(known) || JSON.stringify(saved.unknown) !== JSON.stringify(unknown)) {
    return `After "I knew it", the key 'flashcards-progress' should hold ${JSON.stringify(want)}: save() with JSON.stringify(state).`;
  }
  if (probe.afterReset.score !== '0 known · 0 to review' || probe.afterReset.front !== DECK[0].front) return '"Start over" should go back to the first card with an empty score.';
  if (probe.afterReset.stored !== null) {
    let stored = null;
    try { stored = JSON.parse(probe.afterReset.stored); } catch { /* not JSON */ }
    if (!stored || stored.index !== 0 || stored.known?.length || stored.unknown?.length) return '"Start over" should also clear the saved progress.';
  }
  if (!probe.fallback || probe.fallback.error || probe.fallback.index !== 0) {
    return 'Almost: when the saved text isn\'t valid JSON, load() should still work and start fresh. Wrap JSON.parse in try/catch.';
  }
  return true;
};

const tutorial = {
  slug: 'flashcard-page',
  number: 1,
  title: 'Build a flashcard page',
  situation: 'Your team is studying for AWS certifications and wants a quick study tool: a page of flashcards that flip, keep score and remember where you got to. Nobody wants to install an app. You build it as one web page, in plain JavaScript, that works in any browser.',
  level: 'Beginner',
  hours: 3,
  free: true,
  skills: ['HTML, CSS and JavaScript', 'variables', 'strings', 'arrays and objects', 'functions', 'the DOM', 'events', 'JSON', 'localStorage'],
  aws: [],
  overview: 'You\'ll learn JavaScript from your first line: values, arrays, objects and functions. Then you\'ll build a flashcard page step by step: it shows a card, flips it, keeps score, works from the keyboard, and remembers your progress after you close the browser.',
  steps: [
    {
      id: 'three-languages',
      kind: 'read',
      runtime: 'web',
      title: 'HTML, CSS and JavaScript',
      minutes: 12,
      body: `Every web page is built from three languages, each with one job:

| Language | Its job | In a flashcard page |
|---|---|---|
| **HTML** | What's on the page: headings, paragraphs, buttons | The card, the score, the buttons |
| **CSS** | How it looks: colors, sizes, layout | White card, green button, the back hidden until flipped |
| **JavaScript** | What it does: reacting to clicks, changing the page | Flip the card, count the score, remember it |

Below are the three files of the page you'll build. \`index.html\` loads the other two: \`<link rel="stylesheet" href="style.css">\` pulls in the CSS, and \`<script src="app.js"></script>\` runs the JavaScript. The preview shows the result, and under it is the **console**: the place where JavaScript prints messages, and where you can type JavaScript straight into the page.

Look at \`index.html\` first. Each element has a **tag** (\`<p>\`, \`<button>\`), and some have an \`id\`, a unique name that JavaScript uses to find them: \`id="score"\`, \`id="flip"\`.

Now press **Run** on each box. They send JavaScript to the page:

\`\`\`js
document.title
\`\`\`

\`\`\`js
document.querySelector('#front-text').textContent
\`\`\`

\`\`\`js
document.querySelector('#score').textContent = 'You changed this'
\`\`\`

The last one changed the page, without touching \`index.html\`: that's what JavaScript is for. \`document\` is the page, \`querySelector('#score')\` finds the element whose id is \`score\` (the \`#\` means "id", like in CSS), and \`textContent\` is its text.

> Edit \`app.js\` and press **Run the page** whenever you like. Nothing here can break your computer.`,
      files: files(HELLO_APP),
      scenario: {},
    },
    {
      id: 'values',
      kind: 'try',
      runtime: 'node',
      title: 'Values, variables and text',
      minutes: 15,
      body: `This console runs JavaScript on its own, without a page. Type a line at \`>\` and press Enter, or press **Run** on a box.

\`\`\`js
2 + 3 * 4
\`\`\`

A **variable** is a name for a value. Make one with \`const\` when it won't change, and \`let\` when it will:

\`\`\`js
const service = 'Amazon S3';
let known = 3;
known = known + 1;
known
\`\`\`

In a program, giving a \`const\` a new value is an error: that's the point of it. Use \`const\` by default and \`let\` only when you have to.

| Kind | Examples | \`typeof\` says |
|---|---|---|
| Text, a **string** | \`'Lambda'\`, \`"Lambda"\` | \`'string'\` |
| A **number** (whole or not) | \`42\`, \`2.5\` | \`'number'\` |
| True or false, a **boolean** | \`true\`, \`false\` | \`'boolean'\` |
| Nothing there | \`undefined\`, \`null\` | |

### Text with values inside

A **template literal** uses backticks (\`\` \` \`\`, the key above Tab) instead of quotes, and puts any value in \`\${ }\` into the text:

\`\`\`js
\`\${service}: \${known} cards known\`
\`\`\`

### Comparing

\`===\` asks "are these exactly equal?" and gives \`true\` or \`false\`:

\`\`\`js
'3' === 3
\`\`\`

\`false\`: text and a number are never the same. JavaScript also has \`==\`, which converts types first and gives surprises (\`'3' == 3\` is \`true\`). Always use \`===\` and \`!==\`.`,
      task: 'Make three variables, `name` (the text `Lambda`), `known` (the number 4) and `total` (6). Then use a template literal to show the text `Lambda: 4 of 6 known`, built from the variables.',
      hint: 'One per line: `const name = \'Lambda\';` and so on. Then a last line with the template literal: `` `${name}: ${known} of ${total} known` ``.',
      solution: "const name = 'Lambda';\nconst known = 4;\nconst total = 6;\n`${name}: ${known} of ${total} known`",
      scenario: {},
      check: ({ result }) => (result.stdout.includes('Lambda: 4 of 6 known') ? true : null),
      success: 'Template literals are how the page will show its score: `` `${known.length} known · ${unknown.length} to review` ``.',
    },
    {
      id: 'arrays-objects',
      kind: 'read',
      runtime: 'node',
      title: 'Arrays, objects and functions',
      minutes: 15,
      body: `An **array** is a list of values, in square brackets. Positions start at **0**:

\`\`\`js
const tags = ['storage', 's3'];
tags[0]
\`\`\`

\`\`\`js
tags.push('security');
tags.length
\`\`\`

An **object** groups named values, in curly brackets. Each flashcard is one:

\`\`\`js
const card = {
  id: 's3-bucket',
  front: 'What does Amazon S3 store?',
  back: 'Objects (files) in buckets',
  hint: 'S3 is short for Simple Storage Service',
  tags: ['storage', 's3'],
  difficulty: 'easy',
};
card.front
\`\`\`

\`card.front\` reads one value; \`card.tags.length\` reaches inside. That shape, \`{ id, front, back, hint, tags, difficulty }\`, is the one the AWS Study Hub games use for every flashcard.

### Functions

A **function** is a named piece of code you can run again with different values. \`return\` sends the answer back:

\`\`\`js
function scoreText(known, unknown) {
  return \`\${known.length} known · \${unknown.length} to review\`;
}
scoreText(['a', 'b'], ['c'])
\`\`\`

A shorter way to write a function is an **arrow function**: \`(parameters) => answer\`.

\`\`\`js
const double = (n) => n * 2;
double(21)
\`\`\`

Arrays have methods that take a function and run it on every item. Two you'll use all the time:

\`\`\`js
const deck = [card, { id: 'cognito-pool', front: 'What does a Cognito user pool give your app?', back: 'Sign-in', hint: '', tags: ['security'], difficulty: 'hard' }];
deck.map((c) => c.id)
\`\`\`

\`\`\`js
deck.filter((c) => c.difficulty === 'easy').length
\`\`\`

| Method | Gives back | Example |
|---|---|---|
| \`.map(fn)\` | a new array of whatever \`fn\` returns | every card's id |
| \`.filter(fn)\` | the items where \`fn\` returns true | only the easy cards |
| \`.find(fn)\` | the first item where \`fn\` returns true | the card with this id |
| \`.includes(x)\` | \`true\` if \`x\` is in the array | is this id already known? |

### Going round in circles

\`%\` gives the **remainder** of a division: \`7 % 8\` is 7, \`8 % 8\` is 0. That's handy for "the next card, and after the last one, back to the first":

\`\`\`js
(7 + 1) % 8
\`\`\``,
      scenario: {},
    },
    {
      id: 'deck-functions',
      kind: 'try',
      runtime: 'web',
      title: 'The deck and its functions',
      minutes: 20,
      body: 'Here\'s the real deck: eight AWS cards in an array. Before the page shows anything, write the three small functions it will need. **Run the page** and the console shows what they return. You can also call them yourself in the console, like `nextIndex(3, 8)`.',
      task: 'Finish the three functions: `scoreText(known, unknown)` returns text like `3 known · 1 to review`; `nextIndex(index, total)` returns the next position, and 0 after the last card; `cardsAt(level)` returns only the cards with that difficulty.',
      hint: 'A template literal with `known.length` and `unknown.length`. For the next card, `(index + 1) % total`. For the difficulty, `deck.filter((card) => card.difficulty === level)`.',
      solution: FUNCTIONS_SOLUTION,
      files: files(FUNCTIONS_STARTER),
      scenario: {},
      probe: `return {
  score: scoreText(['a', 'b', 'c'], ['d']),
  empty: scoreText([], []),
  next: [nextIndex(0, 8), nextIndex(7, 8)],
  hard: cardsAt('hard').map((card) => card.id),
  easy: cardsAt('easy').length,
};`,
      check: checkFunctions,
      success: 'Small functions with one job each are easy to test: you just did, by calling them with tricky values.',
    },
    {
      id: 'the-dom',
      kind: 'read',
      runtime: 'web',
      title: 'Changing the page: the DOM',
      minutes: 12,
      body: `When the browser reads \`index.html\`, it builds a tree of objects, one per element: the **DOM** (Document Object Model). JavaScript changes the page by changing those objects. The page updates straight away.

| To do this | Write |
|---|---|
| Find one element | \`document.querySelector('#score')\` (\`#\` for an id, \`.\` for a class, or a tag name like \`'li'\`) |
| Change its text | \`element.textContent = 'New text'\` |
| Add, remove or switch a CSS class | \`element.classList.add('flipped')\`, \`.remove(...)\`, \`.toggle(...)\` |
| Make a new element | \`document.createElement('li')\` |
| Put it inside another | \`parent.append(child)\` |

Try them on the page below:

\`\`\`js
const card = document.querySelector('#card');
document.querySelector('#back-text').textContent = 'Objects (files) in buckets';
card.classList.add('flipped');
\`\`\`

The answer appeared because \`style.css\` has a rule \`#card.flipped #back-text { display: block; }\`: JavaScript only switched a class, and CSS did the showing. Keeping the look in CSS and the behavior in JavaScript keeps both simple.

\`\`\`js
card.classList.toggle('flipped');
\`\`\`

\`\`\`js
const li = document.createElement('li');
li.textContent = 'storage';
document.querySelector('#tags').append(li);
\`\`\`

> \`textContent\` puts in plain text. You'll also see \`innerHTML\`, which reads its text as HTML. Never use it with text that came from a user or another website: that text could carry HTML that runs code in your page, an attack called cross-site scripting.`,
      files: files(SHOW_STARTER),
      scenario: {},
    },
    {
      id: 'show-card',
      kind: 'try',
      runtime: 'web',
      title: 'Show a card',
      minutes: 20,
      body: 'The page now has a **state**: an object saying which card you\'re on and which ones you\'ve answered: `{ index: 0, known: [], unknown: [] }`. `render()` draws the page from that state. Every change from here on will work the same way: change `state`, then call `render()`.',
      task: 'Finish `render()` so the page shows the current card\'s back (in `#back-text`, hidden until flipped), the score in `#score`, and one `<li>` per tag in `#tags`.',
      hint: '`document.querySelector(\'#back-text\').textContent = card.back;` For the tags: `const tags = document.querySelector(\'#tags\'); tags.textContent = \'\';` then `for (const tag of card.tags) { const li = document.createElement(\'li\'); li.textContent = tag; tags.append(li); }`',
      solution: SHOW_SOLUTION,
      files: files(SHOW_STARTER),
      scenario: {},
      probe: withRestore(`  const look = () => ({ front: practice.text('#front-text'), back: practice.text('#back-text'), score: practice.text('#score'), tags: practice.all('#tags li').map((li) => li.textContent) });
  const first = look();
  state.index = 3;
  render();
  render();
  const fourth = look();
  return { ...first, front4: fourth.front, tags4: fourth.tags };`),
      check: checkShow,
      success: 'Notice the second `render()` call in your head: because it empties `#tags` first, drawing the page twice gives the same page. That\'s what makes "change the state, then render" safe.',
    },
    {
      id: 'events',
      kind: 'read',
      runtime: 'web',
      title: 'Reacting to clicks and keys',
      minutes: 12,
      body: `A page waits for things to happen: a click, a key, a form being sent. These are **events**. \`addEventListener\` says "when this event happens here, run this function":

\`\`\`js
document.querySelector('#flip').addEventListener('click', () => {
  console.log('Flip was clicked');
});
\`\`\`

Now click **Flip** in the preview, and watch the console. The function you pass in is called a **callback**: you hand it over, and the browser calls it back later, every time the event happens.

Keys work the same way. Listen on the whole \`document\`, and the **event object** says which key it was:

\`\`\`js
document.addEventListener('keydown', (event) => {
  console.log('You pressed', event.key);
});
\`\`\`

Click in the preview, then press a few keys. Space is \`' '\`, the arrows are \`'ArrowLeft'\` and \`'ArrowRight'\`.

\`event.preventDefault()\` stops what the browser would normally do: Space scrolls the page, or presses whichever button you last clicked. A flashcard page wants Space for itself.

### Passing a function, or calling one?

\`\`\`text
button.addEventListener('click', flip);      // right: pass the function itself
button.addEventListener('click', flip());    // wrong: calls flip now, once, and passes its result
button.addEventListener('click', () => answer(true));   // right: a small function that calls answer(true) later
\`\`\`

The second line is one of the most common bugs in JavaScript: the card flips once when the page loads, and never again.`,
      files: files(SHOW_SOLUTION),
      scenario: {},
    },
    {
      id: 'flip-and-score',
      kind: 'try',
      runtime: 'web',
      title: 'Flip, answer, keep score',
      minutes: 25,
      body: `Time to make it work. \`flip()\` turns the card over. \`answer(knewIt)\` records the answer for the current card and moves on. Then wire both to the buttons and the keyboard.

When you record an answer, first take that card's id out of **both** lists with \`filter\`. Otherwise a card you get wrong, then right, would count in both.`,
      task: 'Make **Flip** (and Space) turn the card over and back; **I knew it** (and →) and **Again** (and ←) record the answer in `state.known` or `state.unknown`, move to the next card and update the score; after the last card, the deck starts again.',
      hint: '`flip`: `document.querySelector(\'#card\').classList.toggle(\'flipped\')`. In `answer`: `state.known = state.known.filter((x) => x !== id)`, the same for `unknown`, then `if (knewIt) state.known.push(id); else state.unknown.push(id);`, then `state.index = nextIndex(state.index, deck.length); save(); render();`. Then `addEventListener(\'click\', ...)` on the three buttons, and `keydown` on `document`.',
      solution: EVENTS_SOLUTION,
      files: files(EVENTS_STARTER),
      scenario: {},
      probe: FLIP_PROBE,
      check: checkFlip,
      success: 'It\'s a real study tool now. Try it in the preview: Space, then → or ←, again and again. Only one thing is missing: close the page and your score is gone.',
    },
    {
      id: 'storage',
      kind: 'read',
      runtime: 'web',
      title: 'Remembering: JSON and localStorage',
      minutes: 12,
      body: `Every browser gives each website a small box to keep text in, **localStorage**. It survives closing the tab, and even restarting the computer:

\`\`\`js
localStorage.setItem('greeting', 'hello');
localStorage.getItem('greeting')
\`\`\`

\`\`\`js
localStorage.getItem('nothing-here')
\`\`\`

A key that was never saved gives \`null\`. And localStorage only stores **text**. To save an object like \`state\`, turn it into text first with **JSON** (JavaScript Object Notation), the format almost every web service uses:

\`\`\`js
const text = JSON.stringify({ index: 2, known: ['s3-bucket'], unknown: [] });
text
\`\`\`

\`\`\`js
JSON.parse(text).known
\`\`\`

\`JSON.stringify\` turns a value into JSON text; \`JSON.parse\` turns it back.

### When the saved text is broken

Someone edits it by hand, or an older version of your page saved something different. \`JSON.parse\` then **throws** an error, and an error at the top of \`app.js\` stops the whole page. **try / catch** catches it, so you can start fresh instead:

\`\`\`js
try {
  JSON.parse('{oops');
} catch (error) {
  console.log('Not JSON:', error.message);
}
\`\`\`

> localStorage belongs to one browser on one device, and anyone using that browser can read it. It's right for study progress, wrong for passwords or tokens. In Tutorial 4, progress moves to a database behind a sign-in, so it follows you to every device.`,
      files: files(EVENTS_SOLUTION),
      scenario: {},
    },
    {
      id: 'remember',
      kind: 'try',
      runtime: 'web',
      title: 'Remember the progress',
      minutes: 20,
      body: 'The page already calls `save()` after every answer and `load()` when it opens. Write those two functions. Then try it: answer a few cards, press **Run the page** again (just like closing and reopening it), and you should be exactly where you were.',
      task: 'Make `save()` store `state` as JSON under the key `flashcards-progress`, and `load()` read it back when the page opens: with a fresh state when nothing is saved, or when the saved text isn\'t valid JSON.',
      hint: '`save`: `localStorage.setItem(STORAGE_KEY, JSON.stringify(state))`. `load`: `const saved = localStorage.getItem(STORAGE_KEY); if (saved === null) return freshState();` then `try { return JSON.parse(saved); } catch { return freshState(); }`.',
      solution: APP_SOLUTION,
      files: files(STORAGE_STARTER),
      scenario: {
        storage: { 'flashcards-progress': JSON.stringify({ index: 2, known: ['s3-bucket'], unknown: ['lambda-what'] }) },
      },
      probe: REMEMBER_PROBE,
      check: checkRemember,
      success: 'Done: the page flips cards, keeps score, works from the keyboard and remembers. Someone else on your team can open it and start studying, with nothing to install.',
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'Which language decides that the back of the card is hidden until it\'s flipped?', options: ['HTML', 'CSS, through the rule for #card.flipped', 'JSON', 'localStorage'], answer: 1, explain: 'JavaScript only adds or removes the class "flipped". The CSS rule `#card.flipped #back-text { display: block; }` does the showing.' },
        { q: 'What is `\'3\' === 3`?', options: ['true', 'false', 'An error', '6'], answer: 1, explain: '`===` never converts types: a string is never equal to a number. Stick to `===` and `!==`.' },
        { q: 'Which line flips the card on every click?', options: ['`button.addEventListener(\'click\', flip())`', '`button.addEventListener(\'click\', flip)`', '`button.onclick(flip)`', '`flip.addEventListener(button)`'], answer: 1, explain: 'Pass the function itself. `flip()` with brackets calls it once, right away, and passes its result instead.' },
        { q: 'What does `(7 + 1) % 8` give?', options: ['8', '1', '0', '7'], answer: 2, explain: '8 divided by 8 leaves a remainder of 0: back to the first card.' },
        { q: '`localStorage.getItem(\'progress\')` was never saved. What do you get?', options: ['An empty object', '`undefined`', '`null`', 'An error'], answer: 2, explain: 'A missing key gives `null`. That\'s why `load()` checks for it before calling `JSON.parse`.' },
        { q: 'Why wrap `JSON.parse(saved)` in try / catch?', options: ['It makes it faster', 'Broken text would throw an error and stop the whole page', 'localStorage requires it', 'To hide the data'], answer: 1, explain: 'An error that nothing catches stops the script. Catching it lets the page start fresh instead of showing nothing.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'js1-const-let', front: 'When do you use `const`, and when `let`?', back: '`const` by default; `let` only for a variable you will change later.', hint: 'One can be reassigned', tags: ['variables'], difficulty: 'easy' },
        { id: 'js1-template', front: 'Put `n` into the text "n cards known"', back: '`` `${n} cards known` `` (a template literal, with backticks)', tags: ['strings'], difficulty: 'easy' },
        { id: 'js1-query', front: 'Find the element with id `score`', back: '`document.querySelector(\'#score\')`', tags: ['dom'], difficulty: 'easy' },
        { id: 'js1-classlist', front: 'Switch the class `flipped` on and off on an element', back: '`element.classList.toggle(\'flipped\')`', tags: ['dom'], difficulty: 'easy' },
        { id: 'js1-listener', front: 'Run `flip` every time `#flip` is clicked', back: '`document.querySelector(\'#flip\').addEventListener(\'click\', flip)`: the function itself, no brackets', tags: ['events'], difficulty: 'medium' },
        { id: 'js1-filter', front: 'Remove `id` from the array `known`', back: '`known = known.filter((x) => x !== id)`', hint: 'Keep everything that isn\'t it', tags: ['arrays'], difficulty: 'medium' },
        { id: 'js1-json', front: 'Save the object `state` in localStorage under `progress`', back: '`localStorage.setItem(\'progress\', JSON.stringify(state))`; read it back with `JSON.parse(localStorage.getItem(\'progress\'))`', tags: ['storage', 'json'], difficulty: 'medium' },
        { id: 'js1-textcontent', front: 'Why prefer `textContent` over `innerHTML` for text from users?', back: '`innerHTML` reads text as HTML, so a user could slip in code that runs in your page (cross-site scripting). `textContent` is always plain text.', tags: ['security', 'dom'], difficulty: 'hard' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 30,
      body: `Put the page on your computer, then on the internet for your team, for free.

1. **Make a folder** for the project:

\`\`\`sh
mkdir -p ~/aws-study-projects/javascript/flashcards
cd ~/aws-study-projects/javascript/flashcards
\`\`\`

2. **Save the three files** into it: copy \`app.js\` from the last step's editor, and \`index.html\` and \`style.css\` from the same editor tabs (or use the download buttons below). Any text editor works; [Visual Studio Code](https://code.visualstudio.com) is free and the most popular one for JavaScript.

3. **Open it.** Double-click \`index.html\`, or from the terminal:

\`\`\`sh
open index.html        # Mac
xdg-open index.html    # Linux
explorer.exe index.html    # Windows Subsystem for Linux
\`\`\`

Nothing to install: the browser is the whole runtime. To see the console, right-click the page, choose **Inspect**, and open the **Console** tab. Your \`console.log\` lines show up there, and you can type JavaScript into it just like on this site.

4. **Make it yours.** Add your own cards to \`deck\`, for the exam you're studying. Keep the same shape, \`{ id, front, back, hint, tags, difficulty }\`, and give every card its own \`id\`.

5. **Put it on GitHub** (see *Start here*), then turn on **GitHub Pages**: in the repository, *Settings* → *Pages* → *Build and deployment*: Source **Deploy from a branch**, branch \`main\`, folder \`/ (root)\` → **Save**. A minute later your page is live at \`https://YOUR-NAME.github.io/REPOSITORY/\`. Send the link to your team.

\`\`\`sh
git init
git add index.html style.css app.js
git commit -m "AWS flashcards page"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/aws-flashcards.git
git push -u origin main
\`\`\`

Each person's progress stays in their own browser, so the whole team can use the same link.

**Cost:** nothing. GitHub Pages is free for public repositories. In TypeScript Tutorial 1 you'll make this same page bug-proof, and in JavaScript Tutorial 4 its progress moves to AWS behind a sign-in.`,
      downloads: [
        { label: 'Download index.html', filename: 'index.html', content: () => PAGE_HTML },
        { label: 'Download style.css', filename: 'style.css', content: () => PAGE_CSS },
        { label: 'Download app.js (finished)', filename: 'app.js', content: () => APP_SOLUTION },
      ],
      checklist: [
        'The page works on my computer, opened straight from the folder',
        'I added at least three cards of my own',
        'It\'s on GitHub, and live on GitHub Pages',
      ],
    },
  ],
};

export default tutorial;
