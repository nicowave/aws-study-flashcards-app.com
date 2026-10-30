// Tutorial 1 (free): convert the team's flashcard page to TypeScript, so the
// next typo is caught in the editor instead of in production.
//
// The page is the same one JavaScript tutorial 1 builds: cards are
// { id, front, back, hint, tags, difficulty }, progress { index, known,
// unknown } is saved under 'flashcards-progress', and the buttons are #flip,
// #know, #again and #reset.

// ---------------------------------------------------------------------------
// The page
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
    <p id="progress"></p>
    <div id="card">
      <p id="front"></p>
      <p id="back"></p>
      <p id="hint"></p>
    </div>
    <div class="buttons">
      <button id="flip">Flip</button>
      <button id="know">I knew it</button>
      <button id="again">Review again</button>
    </div>
    <p id="score"></p>
    <button id="reset">Start over</button>
  </main>
  <script src="app.js"></script>
</body>
</html>`;

export const PAGE_CSS = `* { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; margin: 0; padding: 24px 16px; background: #f4f6f8; color: #14202e; }
main { max-width: 520px; margin: 0 auto; }
h1 { font-size: 1.4rem; margin: 0 0 4px; }
#progress { color: #5a6b7d; margin: 0 0 16px; font-size: 0.9rem; }
#card { background: #fff; border-radius: 12px; padding: 28px 20px; min-height: 160px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); text-align: center; }
#front { font-size: 1.3rem; font-weight: 600; margin: 0; }
#back { display: none; margin: 16px 0 0; font-size: 1.05rem; }
#hint { color: #5a6b7d; font-size: 0.85rem; margin: 12px 0 0; }
#card.flipped #back { display: block; }
#card.flipped #hint { display: none; }
.buttons { display: flex; gap: 8px; margin: 16px 0; flex-wrap: wrap; }
button { font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid #c7d0da; background: #fff; cursor: pointer; }
#flip { background: #2a6898; color: #fff; border-color: #2a6898; }
#score { font-weight: 600; }`;

// ---------------------------------------------------------------------------
// app.ts, assembled from parts so each step can start from the right version
// ---------------------------------------------------------------------------

const CARDS = `const cards: Card[] = [
  { id: 's3', front: 'Amazon S3', back: 'Object storage: files in buckets, reached over HTTPS.', hint: 'Simple Storage Service', tags: ['storage'], difficulty: 'easy' },
  { id: 'ec2', front: 'Amazon EC2', back: 'Virtual servers you rent by the second.', tags: ['compute'], difficulty: 'easy' },
  { id: 'lambda', front: 'AWS Lambda', back: 'Runs your function when an event arrives, with no servers to manage.', hint: 'Serverless', tags: ['compute', 'serverless'], difficulty: 'easy' },
  { id: 'dynamodb', front: 'Amazon DynamoDB', back: 'A serverless key-value and document database.', tags: ['database'], difficulty: 'medium' },
  { id: 'iam-role', front: 'IAM role', back: 'An identity with permissions that a service or person takes on for a while, with short-lived credentials.', hint: 'Not a user', tags: ['security'], difficulty: 'medium' },
  { id: 'cloudfront', front: 'Amazon CloudFront', back: 'A content delivery network that caches your site close to your visitors.', tags: ['networking'], difficulty: 'medium' },
  { id: 'dlq', front: 'Dead-letter queue', back: 'Where messages go after failing too many times, so you can look at them later.', hint: 'Amazon SQS', tags: ['messaging'], difficulty: 'hard' },
];`;

const TYPES = `// app.ts: the team's flashcard page, in TypeScript.
type Difficulty = 'easy' | 'medium' | 'hard';

interface Card {
  readonly id: string;
  front: string;
  back: string;
  hint?: string;
  tags: string[];
  difficulty: Difficulty;
}

interface Progress {
  index: number;
  known: string[]; // card ids
  unknown: string[];
}

const STORAGE_KEY = 'flashcards-progress';

${CARDS}

// Find an element, or stop with a clear message. The return type has no
// "| null", so code that uses it doesn't need a check every time.
function element(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(\`The page has no \${selector}\`);
  return found;
}

function freshProgress(): Progress {
  return { index: 0, known: [], unknown: [] };
}
`;

const LOAD_PLAIN = `
function loadProgress(): Progress {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return freshProgress();
  return JSON.parse(raw);
}
`;

const LOAD_STARTER = `
// Saved data comes from outside the program: an older version of this page,
// another browser tab, a person editing it by hand. Check it before trusting it.
function isProgress(value: unknown): value is Progress {
  // TODO: true only when value is an object (and not null) whose index is a
  //       number, and whose known and unknown are arrays of strings
  return true;
}

function loadProgress(): Progress {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return freshProgress();
  // TODO: JSON.parse throws on text that isn't JSON: catch that.
  //       Then return the saved value only if isProgress says it's valid,
  //       and freshProgress() otherwise.
  return JSON.parse(raw);
}
`;

const LOAD_SOLUTION = `
// Saved data comes from outside the program: an older version of this page,
// another browser tab, a person editing it by hand. Check it before trusting it.
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isProgress(value: unknown): value is Progress {
  if (typeof value !== 'object' || value === null) return false;
  const saved = value as Record<string, unknown>;
  return typeof saved.index === 'number'
    && Number.isInteger(saved.index)
    && saved.index >= 0
    && isStringArray(saved.known)
    && isStringArray(saved.unknown);
}

function loadProgress(): Progress {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return freshProgress();
  let saved: unknown;
  try {
    saved = JSON.parse(raw);
  } catch {
    return freshProgress(); // not JSON at all
  }
  return isProgress(saved) ? saved : freshProgress();
}
`;

const RENDER = ({ buggy }) => `
function saveProgress(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

let progress: Progress = loadProgress();

function currentCard(): Card {
  return cards[progress.index % cards.length];
}

function render(): void {
  const card = currentCard();
  element('#front').textContent = card.${buggy ? 'fornt' : 'front'};
  element('#back').textContent = card.back;
  element('#hint').textContent = card.hint ? \`Hint: \${card.hint}\` : '';
  element('#card').classList.remove('flipped');
  element('#progress').textContent = \`Card \${(progress.index % cards.length) + 1} of \${cards.length} · \${card.difficulty}\`;
${buggy
    ? `  const score = document.querySelector('#score');
  score.textContent = \`\${progress.known.length} known · \${progress.unknown.length} to review\`;`
    : '  element(\'#score\').textContent = `${progress.known.length} known · ${progress.unknown.length} to review`;'}
}

function answer(knew: boolean): void {
  const card = currentCard();
  // A card is in one list at a time: take it out of both, then add it to one
  progress.known = progress.known.filter((id) => id !== card.id);
  progress.unknown = progress.unknown.filter((id) => id !== card.id);
  if (knew) {
    progress.known.push(${buggy ? 'card' : 'card.id'});
  } else {
    progress.unknown.push(card.id);
  }
  progress.index = (progress.index + 1) % cards.length;
  saveProgress();
  render();
}

element('#flip').addEventListener('click', () => element('#card').classList.toggle('flipped'));
element('#know').addEventListener('click', () => answer(true));
element('#again').addEventListener('click', () => answer(false));
element('#reset').addEventListener('click', () => {
  progress = freshProgress();
  saveProgress();
  render();
});

render();
`;

export const FIX_STARTER = TYPES + LOAD_PLAIN + RENDER({ buggy: true });
export const FIX_SOLUTION = (TYPES + LOAD_PLAIN + RENDER({ buggy: false })).trimEnd();
export const GUARD_STARTER = TYPES + LOAD_STARTER + RENDER({ buggy: false });
export const GUARD_SOLUTION = (TYPES + LOAD_SOLUTION + RENDER({ buggy: false })).trimEnd();

const pageFiles = (starter) => [
  { path: 'app.ts', starter },
  { path: 'index.html', starter: PAGE_HTML },
  { path: 'style.css', starter: PAGE_CSS },
];

// ---------------------------------------------------------------------------
// Smaller programs for the first steps
// ---------------------------------------------------------------------------

const BASICS_STARTER = `// basics.ts: a few typed values. Press Run, then read the errors below.
let deckName: string = 'AWS basics';
let cardCount: number = 6;
const tags: string[] = ['storage', 'compute', 'security'];

// The deck just got its seventh card
cardCount = 'seven';

function describeDeck(name: string, count: number): string {
  return \`\${name}: \${count} cards\`;
}

console.log(describeDeck(cardCount, deckName));
console.log(\`\${tags.lenght} tags\`);
`;

const BASICS_SOLUTION = `// basics.ts: a few typed values. Press Run, then read the errors below.
let deckName: string = 'AWS basics';
let cardCount: number = 6;
const tags: string[] = ['storage', 'compute', 'security'];

// The deck just got its seventh card
cardCount = 7;

function describeDeck(name: string, count: number): string {
  return \`\${name}: \${count} cards\`;
}

console.log(describeDeck(deckName, cardCount));
console.log(\`\${tags.length} tags\`);`;

// The card data as it was before TypeScript: two mistakes nobody saw
const CARDS_STARTER = `// cards.ts: the deck. Nothing here has a type yet, so nothing is checked.
// TODO 1: describe a card: an interface Card and a type Difficulty
// TODO 2: say that cards is a list of them: const cards: Card[] = ...
// TODO 3: fix whatever TypeScript finds

export const cards = [
  { id: 's3', front: 'Amazon S3', back: 'Object storage: files in buckets, reached over HTTPS.', hint: 'Simple Storage Service', tags: ['storage'], difficulty: 'easy' },
  { id: 'ec2', front: 'Amazon EC2', back: 'Virtual servers you rent by the second.', tags: ['compute'], difficulty: 'easy' },
  { id: 'lambda', front: 'AWS Lambda', back: 'Runs your function when an event arrives, with no servers to manage.', hint: 'Serverless', tags: ['compute', 'serverless'], difficulty: 'easy' },
  { id: 'dynamodb', front: 'Amazon DynamoDB', back: 'A serverless key-value and document database.', tags: ['database'], difficulty: 'medium' },
  { id: 'iam-role', front: 'IAM role', bakc: 'An identity with permissions that a service or person takes on for a while, with short-lived credentials.', hint: 'Not a user', tags: ['security'], difficulty: 'medium' },
  { id: 'cloudfront', front: 'Amazon CloudFront', back: 'A content delivery network that caches your site close to your visitors.', tags: ['networking'], difficulty: 'medum' },
  { id: 'dlq', front: 'Dead-letter queue', back: 'Where messages go after failing too many times, so you can look at them later.', hint: 'Amazon SQS', tags: ['messaging'], difficulty: 'hard' },
];

console.log(\`\${cards.length} cards ready\`);
`;

const CARDS_SOLUTION = `// cards.ts: the deck, with types.
type Difficulty = 'easy' | 'medium' | 'hard';

interface Card {
  readonly id: string;
  front: string;
  back: string;
  hint?: string;
  tags: string[];
  difficulty: Difficulty;
}

export ${CARDS}

console.log(\`\${cards.length} cards ready\`);`;

const s = (n) => (n === 1 ? '' : 's');
const errorsLeft = (diagnostics) => `TypeScript still reports ${diagnostics.length} error${s(diagnostics.length)}. Fix ${diagnostics.length === 1 ? 'it' : 'them'} and run again: each one says the line and what's wrong.`;

const PROBE_PAGE = `await practice.click('#reset');
const front = practice.text('#front');
await practice.click('#flip');
const flipped = practice.$('#card').classList.contains('flipped');
const back = practice.text('#back');
await practice.click('#know');
const second = practice.text('#front');
await practice.click('#again');
const score = practice.text('#score');
const saved = JSON.parse(practice.storage()['flashcards-progress'] || 'null');
return { front, flipped, back, second, score, saved };`;

const PROBE_GUARD = `const KEY = 'flashcards-progress';
const good = { index: 2, known: ['s3'], unknown: ['iam-role'] };
const checks = [
  isProgress(good),
  isProgress({ card: 3, known: 5 }),
  isProgress({ index: '2', known: 's3', unknown: [] }),
  isProgress(null),
  isProgress('{"index": 0}'),
  isProgress({ index: 1, known: ['ec2'], unknown: [2] }),
];
localStorage.setItem(KEY, JSON.stringify(good));
const loadedGood = loadProgress();
localStorage.setItem(KEY, JSON.stringify({ card: 3, known: 5 }));
const loadedOld = loadProgress();
localStorage.setItem(KEY, 'not json {');
let loadedBroken;
try { loadedBroken = loadProgress(); } catch (e) { loadedBroken = 'threw ' + e.name; }
localStorage.setItem(KEY, JSON.stringify(good));
return { checks, loadedGood, loadedOld, loadedBroken };`;

const FRESH = JSON.stringify({ index: 0, known: [], unknown: [] });

const tutorial = {
  slug: 'bug-proof-flashcards',
  number: 1,
  title: 'Make the flashcard page bug-proof',
  situation: 'Someone tidied up the team\'s flashcard page and typed `card.fornt` instead of `card.front`. Every card came up blank for a whole day before anyone noticed. You convert the page to TypeScript, and watch the editor catch that kind of mistake before it ever reaches a browser.',
  level: 'Beginner',
  hours: 3,
  free: true,
  skills: ['type annotations', 'interfaces', 'union types', 'optional properties', 'strict null checks', 'type guards', 'reading compiler errors'],
  aws: [],
  overview: 'You\'ll learn what TypeScript adds to JavaScript and how to read its errors. Then you\'ll describe the flashcards with an interface, fix the bugs TypeScript finds in the real page, and make the page safe against saved data it can\'t trust.',
  steps: [
    {
      id: 'the-incident',
      kind: 'read',
      title: 'One typo, one lost day',
      minutes: 8,
      body: `### The page

The team's study page shows one AWS flashcard at a time. You read the front, press **Flip** to see the back, then press **I knew it** or **Review again**. Your progress is saved in the browser (in \`localStorage\`), so it's still there tomorrow.

It's written in JavaScript, the language every browser runs. You don't need to know JavaScript well for this tutorial: you'll recognize most of it as you go.

### What went wrong

One line changed during a tidy-up:

\`\`\`text
front.textContent = card.fornt;
\`\`\`

JavaScript didn't complain. A card has no \`fornt\`, so it quietly produced \`undefined\`, and every card came up blank. Nobody noticed until a learner reported it the next day.

### What TypeScript adds

**TypeScript is JavaScript plus types.** You write down what shape your data has: a card has a \`front\` that's text, a \`difficulty\` that's one of three words, and so on. Then a program called the **compiler** checks every line against those descriptions *before* the code runs.

\`\`\`ts
interface Card {
  front: string;
  back: string;
}

const card: Card = { front: 'Amazon S3', back: 'Object storage' };
card.fornt; // error TS2551: Property 'fornt' does not exist on type 'Card'. Did you mean 'front'?
\`\`\`

The compiler then **erases the types** and hands the browser plain JavaScript. Types cost nothing at run time: they're a safety check for you and your editor, not something the browser ever sees.

| | JavaScript | TypeScript |
|---|---|---|
| File | \`app.js\` | \`app.ts\` |
| Typo in a property name | A blank card in production | Red underline in the editor, error before you ship |
| Runs in the browser | Directly | After the compiler turns it into JavaScript |

> TypeScript is what most JavaScript jobs use now, and it's what the AWS Cloud Development Kit is written in. You'll use it for real AWS work in tutorials 2 and 3.`,
    },
    {
      id: 'first-types',
      kind: 'try',
      runtime: 'node',
      title: 'Your first types, and how to read an error',
      minutes: 15,
      body: `A **type annotation** is a colon after a name, then the type: \`let cardCount: number = 6\`. The basic types are the same three kinds of value JavaScript already has:

| Type | Values |
|---|---|
| \`string\` | text: \`'Amazon S3'\` |
| \`number\` | any number: \`6\`, \`2.5\` |
| \`boolean\` | \`true\` or \`false\` |
| \`string[]\` | a list of strings: \`['storage', 'compute']\` |

Functions say what they take and what they give back: \`function describeDeck(name: string, count: number): string\`.

Press **Run basics.ts**. TypeScript checks the file first and lists what it finds in the console. The code still runs afterwards, so you can see what each bug would have done.

### Reading an error

\`\`\`text
basics.ts(7,1): error TS2322: Type 'string' is not assignable to type 'number'.
\`\`\`

| Part | Means |
|---|---|
| \`basics.ts\` | the file |
| \`(7,1)\` | line 7, column 1 |
| \`TS2322\` | the error's code: search it to find explanations |
| the rest | what's wrong, in plain-ish English |

Read the message from the end: "not assignable to type 'number'" means "this variable only takes numbers". Below each error, the console adds a tip.`,
      task: 'Fix the three errors in `basics.ts` so TypeScript reports **none**, and the program prints `AWS basics: 7 cards` and `3 tags`.',
      hint: 'Line 7: the count is a number, so `7`, not `\'seven\'`. The `describeDeck` call has its arguments the wrong way round. `lenght` is a typo.',
      solution: BASICS_SOLUTION,
      files: [{ path: 'basics.ts', starter: BASICS_STARTER, runLabel: 'Run basics.ts' }],
      scenario: {},
      check: ({ diagnostics, result }) => {
        if (diagnostics.length) return errorsLeft(diagnostics);
        if (!result?.stdout) return null;
        if (!result.stdout.includes('AWS basics: 7 cards')) return 'No errors left. The first line should read `AWS basics: 7 cards`: the deck has 7 cards now.';
        if (!result.stdout.includes('3 tags')) return 'The second line should read `3 tags`.';
        return true;
      },
      success: 'Notice what JavaScript alone would have printed: `seven: AWS basics cards` and `undefined tags`. TypeScript caught all three before they ran.',
    },
    {
      id: 'describe-the-data',
      kind: 'read',
      title: 'Describe your data: interfaces and unions',
      minutes: 15,
      body: `Annotating every variable one by one gets tiring. The real power is describing the **shape of your data** once, and letting TypeScript check every use of it.

### Interfaces

An **interface** names the shape of an object: which properties it has, and the type of each.

\`\`\`ts
interface Card {
  readonly id: string;
  front: string;
  back: string;
  hint?: string;
  tags: string[];
  difficulty: Difficulty;
}
\`\`\`

- \`hint?:\` with a question mark is **optional**: some cards have a hint, some don't. Its type is \`string | undefined\`, so TypeScript makes you handle the missing case.
- \`readonly id\` can be set when the card is created, but never changed afterwards. Progress is saved by card id, so changing an id would lose someone's history.
- \`Card[]\` means "a list of cards". \`const cards: Card[] = [ ... ]\` checks every card in the list.

### Union types

A difficulty isn't just any text: it's one of three words. A **union type** lists the allowed values, separated by \`|\` ("or"):

\`\`\`ts
type Difficulty = 'easy' | 'medium' | 'hard';
\`\`\`

Now \`difficulty: 'medum'\` is an error, and your editor offers the three right words as you type. \`type\` gives any type a name; an interface does the same for object shapes.

### What TypeScript works out by itself

You don't annotate everything. When you write \`let count = 6\`, TypeScript **infers** that \`count\` is a number. Annotate the things other code relies on (function parameters and return types, the shape of your data), and let inference do the rest.

### Extra properties are errors too

\`\`\`ts
const card: Card = { id: 'iam-role', front: 'IAM role', bakc: '...', tags: [], difficulty: 'medium' };
// error TS2561: Object literal may only specify known properties, but 'bakc' does not exist
//               in type 'Card'. Did you mean to write 'back'?
\`\`\`

In JavaScript, \`bakc\` would simply be stored, and \`card.back\` would be \`undefined\`: the same bug as the production incident, hiding in the data instead of the code.`,
    },
    {
      id: 'type-the-cards',
      kind: 'try',
      runtime: 'node',
      title: 'Type the deck, and find the hidden bugs',
      minutes: 20,
      body: '`cards.ts` holds the deck. Nothing in it has a type, so TypeScript can\'t check anything: press **Run cards.ts** and it reports no errors, even though two cards are broken. Add the types and see what turns up.',
      task: 'Add `type Difficulty` and `interface Card` (with `hint` optional), declare `const cards: Card[]`, then fix the mistakes TypeScript finds in the data, so there are **no errors** and every card has a `back` and a real difficulty.',
      hint: 'Copy the interface from the previous step. Then `export const cards: Card[] = [`. TypeScript will point at a misspelled property name in the IAM role card and a misspelled difficulty in the CloudFront card.',
      solution: CARDS_SOLUTION,
      files: [{ path: 'cards.ts', starter: CARDS_STARTER, runLabel: 'Run cards.ts' }],
      scenario: {},
      probe: 'return mod.cards.map((c) => ({ id: c.id, back: typeof c.back, difficulty: c.difficulty }));',
      check: ({ diagnostics, sources, probe }) => {
        // Comments don't count (the starter's TODOs mention "interface Card")
        const src = (sources['cards.ts'] || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
        if (diagnostics.length) return errorsLeft(diagnostics);
        if (!Array.isArray(probe)) return null;
        if (!/(interface|type)\s+Card\b/.test(src)) return 'No errors, but the deck isn\'t typed yet: add an `interface Card` describing a card.';
        if (!/cards\s*:\s*(Card\[\]|Array<Card>)/.test(src)) return 'Add the type to the list itself: `const cards: Card[] = [`. Without it, TypeScript doesn\'t check the cards against the interface.';
        if (/difficulty\s*\??\s*:\s*string\b/.test(src)) return '`difficulty: string` accepts any text, typos included. Use the union: `type Difficulty = \'easy\' | \'medium\' | \'hard\'`.';
        const broken = probe.filter((c) => c.back !== 'string' || !['easy', 'medium', 'hard'].includes(c.difficulty));
        if (broken.length) return `These cards still have a problem: ${broken.map((c) => c.id).join(', ')}.`;
        if (probe.length !== 7) return 'The deck should still have its 7 cards.';
        return true;
      },
      success: 'Two bugs that had been sitting in the data, invisible, found the moment the data had a type. That\'s the trade: a few lines describing your data, in exchange for a check on every line that uses it.',
    },
    {
      id: 'fix-the-page',
      kind: 'try',
      runtime: 'web',
      title: 'Convert the page, fix what TypeScript finds',
      minutes: 30,
      body: `Here's the whole page, already converted to TypeScript: \`app.ts\` has the types from the last step at the top, then the code that shows cards and saves your progress. The preview runs the compiled JavaScript.

Press **Run**. TypeScript finds **three** problems in this version, including the production typo. Look at the preview too: because the code still runs, you can see the bug the way learners saw it, a card with no front.

### Strict mode and null

The practice compiler runs in **strict** mode, like most real projects. One thing strict mode checks is **null**: \`document.querySelector('#score')\` finds the first element matching \`#score\`, but if the page has none it returns \`null\`. So its type is \`Element | null\`, and using it straight away is an error:

\`\`\`text
app.ts(…): error TS18047: 'score' is possibly 'null'.
\`\`\`

There are three ways to deal with that:

| Way | Code | When |
|---|---|---|
| Check it | \`if (score) { score.textContent = '...'; }\` | The element might really be missing |
| Fail loudly | the \`element()\` helper in this file throws a clear error if it's missing | The page can't work without it |
| Tell TypeScript to trust you | \`score!.textContent\` | Avoid: the \`!\` turns the check off, and the crash comes back if you're wrong |

The \`element()\` helper uses another trick: \`querySelector<HTMLElement>\` says what kind of element you expect, and returning a value with no \`| null\` means callers don't need a check every time.`,
      task: 'Fix the three errors in `app.ts` so TypeScript reports **none**. Then try the page: the front shows "Amazon S3", **Flip** shows the back, and the score counts what you answer.',
      hint: 'TS2551: the property is `front`. TS18047: use the `element()` helper like the lines above it: `element(\'#score\').textContent = ...`. TS2345: progress keeps card **ids** (strings), so push `card.id`, not the whole card.',
      solution: FIX_SOLUTION,
      files: pageFiles(FIX_STARTER),
      scenario: {},
      probe: PROBE_PAGE,
      check: ({ diagnostics, probe, result }) => {
        if (diagnostics.length) return errorsLeft(diagnostics);
        if (!probe) return result?.errors?.length ? `No type errors, but the page stopped with an error: ${result.errors[0].text}` : null;
        if (probe.front !== 'Amazon S3') return probe.front ? `The first card's front shows "${probe.front}". It should be "Amazon S3".` : 'The first card\'s front is blank: that\'s the production bug. It should show "Amazon S3".';
        if (!probe.flipped || !probe.back?.startsWith('Object storage')) return 'Flip should show the back of the card.';
        if (probe.score !== '1 known · 1 to review') return `After one "I knew it" and one "Review again", the score reads "${probe.score}". It should be "1 known · 1 to review".`;
        if (JSON.stringify(probe.saved) !== JSON.stringify({ index: 2, known: ['s3'], unknown: ['ec2'] })) return 'The saved progress should hold card ids: { index: 2, known: ["s3"], unknown: ["ec2"] }.';
        return true;
      },
      success: 'Three bugs, zero of them shipped. The third one never even showed on screen: the page would have saved whole cards instead of ids, and quietly broken everyone\'s saved progress the next time the card list changed.',
    },
    {
      id: 'unknown-data',
      kind: 'read',
      title: 'Data you can\'t trust: any, unknown and type guards',
      minutes: 15,
      body: `TypeScript checks *your* code. But some data comes from outside: saved progress from an older version of the page, a reply from an API, a file someone edited by hand. Its type is whatever arrives.

### any: the off switch

\`JSON.parse\` returns the type **\`any\`**, which means "don't check this". An \`any\` value can be used as anything, and TypeScript stays quiet:

\`\`\`ts
const saved = JSON.parse(raw);   // any
saved.known.length;              // no error, even if known is missing
\`\`\`

The page from the last step returns \`JSON.parse(raw)\` as a \`Progress\`, and TypeScript accepts it. If an old version of the page saved \`{ "card": 3 }\` instead, everything still compiles, and the page crashes for that learner.

### unknown: the safe version

**\`unknown\`** also means "could be anything", but TypeScript won't let you use it until you've checked what it is:

\`\`\`ts
const saved: unknown = JSON.parse(raw);
saved.known;                         // error TS18046: 'saved' is of type 'unknown'.
if (typeof saved === 'object' && saved !== null) { /* now it's an object */ }
\`\`\`

Checks like \`typeof x === 'number'\`, \`Array.isArray(x)\` and \`x !== null\` **narrow** the type: inside the \`if\`, TypeScript knows more.

### Type guards

A **type guard** is a function that does those checks and tells TypeScript what it found. Its return type is \`value is Progress\`:

\`\`\`ts
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
\`\`\`

After \`if (isStringArray(x))\`, TypeScript treats \`x\` as \`string[]\`. The compiler trusts your guard, so make it check everything the type promises.

### Errors you'll meet often

| Code | Means | Usual fix |
|---|---|---|
| TS2339 / TS2551 | property doesn't exist (2551: and here's a similar one) | a typo, or the wrong type |
| TS2322 | wrong type going into a variable or property | fix the value, or the type |
| TS2345 | wrong type passed to a function | compare the argument with the parameter |
| TS2741 | an object is missing a required property | add it, or make it optional with \`?\` |
| TS18047 / TS2531 | might be null | check it first |
| TS7006 | a parameter has no type (implicit \`any\`) | annotate it |
| TS18046 | using an \`unknown\` value | narrow it with a check or a type guard |`,
    },
    {
      id: 'safe-progress',
      kind: 'try',
      runtime: 'web',
      title: 'Don\'t trust saved data',
      minutes: 25,
      body: 'This browser has progress saved by an **old version** of the page: `{"card": 3, "known": 5}`. Press **Run**: the page crashes, because it trusts whatever `JSON.parse` returns. Anyone who used the old version would see a broken page.',
      task: 'Finish `isProgress` so it returns `true` only for real progress (a whole-number `index` of 0 or more, and `known` and `unknown` as lists of strings). Then make `loadProgress` return the saved value only when `isProgress` accepts it, and a fresh start otherwise, including when the saved text isn\'t JSON at all.',
      hint: 'Write a small `isStringArray(value: unknown): value is string[]` with `Array.isArray(value) && value.every(...)`. In `isProgress`, rule out non-objects and null first, then `const saved = value as Record<string, unknown>` lets you read `saved.index`. In `loadProgress`, wrap `JSON.parse` in `try { } catch { return freshProgress(); }`.',
      solution: GUARD_SOLUTION,
      files: pageFiles(GUARD_STARTER),
      scenario: { storage: { 'flashcards-progress': JSON.stringify({ card: 3, known: 5 }) } },
      probe: PROBE_GUARD,
      check: ({ diagnostics, probe, probeError }) => {
        if (diagnostics.length) return errorsLeft(diagnostics);
        if (probeError === 'ReferenceError') return 'Keep the functions named `isProgress` and `loadProgress`: the check calls them.';
        if (!probe) return null;
        const [good, old, wrongTypes, isNull, text, numbers] = probe.checks;
        if (!good) return 'isProgress rejects real progress: { index: 2, known: ["s3"], unknown: ["iam-role"] } should be true.';
        if (old || wrongTypes || isNull || text) return 'isProgress still accepts data that isn\'t progress (an old format, wrong types, null or plain text). Check each property\'s type.';
        if (numbers) return 'isProgress accepts `unknown: [2]`: check every item in the lists is a string, not just that they\'re lists.';
        if (JSON.stringify(probe.loadedGood) !== JSON.stringify({ index: 2, known: ['s3'], unknown: ['iam-role'] })) return 'loadProgress should return valid saved progress as it is.';
        if (JSON.stringify(probe.loadedOld) !== FRESH) return 'With old-format data saved, loadProgress should return a fresh start: use isProgress.';
        if (JSON.stringify(probe.loadedBroken) !== FRESH) return `When the saved text isn't JSON, loadProgress ${String(probe.loadedBroken).startsWith('threw') ? 'crashes' : 'should return a fresh start'}: catch the error JSON.parse throws.`;
        return true;
      },
      success: 'Now the page survives anything that\'s been saved: old versions, edits by hand, half-written data. Type guards are how TypeScript code meets the outside world, and you\'ll use the same idea for API requests in the next tutorials.',
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'When does TypeScript check your types?', options: ['While the page runs in the browser', 'Before the code runs: in your editor and when you compile', 'Only on the server', 'After the page crashes'], answer: 1, explain: 'The compiler checks everything first, then erases the types. The browser only ever runs plain JavaScript.' },
        { q: 'With `type Difficulty = \'easy\' | \'medium\' | \'hard\'`, which line is an error?', options: ['`const d: Difficulty = \'easy\'`', '`const d: Difficulty = \'Medium\'`', '`const d: Difficulty = \'hard\'`', 'None of them'], answer: 1, explain: 'Union types of words are exact, capitals included. \'Medium\' isn\'t one of the three.' },
        { q: 'What does `hint?: string` in an interface mean?', options: ['The hint must be a question', 'The property can be left out, so its type is string | undefined', 'The hint is private', 'It must be checked at run time'], answer: 1, explain: 'Optional properties may be missing, and TypeScript makes you handle the undefined case.' },
        { q: 'In strict mode, what type does `document.querySelector(\'#score\')` return?', options: ['`HTMLElement`', '`Element | null`', '`string`', '`any`'], answer: 1, explain: 'It returns null when nothing matches, so you have to check before using it.' },
        { q: 'Why is `JSON.parse(raw) as Progress` risky?', options: ['It\'s slow', 'It tells TypeScript to trust data it can\'t check: if the saved data has another shape, the page crashes', 'JSON.parse doesn\'t work in TypeScript', 'It changes the data'], answer: 1, explain: 'An assertion is a promise, not a check. A type guard (`value is Progress`) actually checks.' },
        { q: '`app.ts(12,5): error TS2551: Property \'fornt\' does not exist on type \'Card\'. Did you mean \'front\'?` Where is the problem?', options: ['Line 5, column 12', 'Line 12, column 5', 'In the Card interface', 'On line 2551'], answer: 1, explain: 'The numbers in brackets are line, then column. TS2551 is the error\'s code.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'ts1-annotation', front: 'Say that `count` is a number', back: '`let count: number = 6` — a colon, then the type.', tags: ['types'], difficulty: 'easy' },
        { id: 'ts1-function', front: 'A function that takes a string and a number and returns a string', back: '`function describe(name: string, count: number): string { ... }`', tags: ['functions'], difficulty: 'easy' },
        { id: 'ts1-interface', front: 'Describe the shape of a card object', back: '`interface Card { front: string; back: string; tags: string[] }`', tags: ['interfaces'], difficulty: 'easy' },
        { id: 'ts1-union', front: 'A type that only allows "easy", "medium" or "hard"', back: '`type Difficulty = \'easy\' | \'medium\' | \'hard\'`', hint: 'union type', tags: ['unions'], difficulty: 'medium' },
        { id: 'ts1-optional', front: 'A property some objects have and some don\'t', back: 'Add `?`: `hint?: string` (its type becomes `string | undefined`).', tags: ['interfaces'], difficulty: 'easy' },
        { id: 'ts1-null', front: '`\'el\' is possibly \'null\'` (TS18047): the safe fix', back: 'Check it first: `if (el) { ... }`, or use a helper that throws a clear error. Avoid `el!`.', tags: ['strict mode'], difficulty: 'medium' },
        { id: 'ts1-unknown', front: '`any` vs `unknown`', back: '`any` turns checking off. `unknown` means "could be anything" but must be checked before use.', tags: ['types'], difficulty: 'medium' },
        { id: 'ts1-guard', front: 'A function that checks a value is a Progress, and tells TypeScript', back: '`function isProgress(value: unknown): value is Progress { ... }` — a type guard.', tags: ['type guards'], difficulty: 'hard' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 30,
      body: `Set up TypeScript on your own computer, compile the page, and open it in a browser.

1. **Install Node.js 22** (it brings \`npm\`, which installs TypeScript). The simplest way on Mac, Linux and the Windows Subsystem for Linux is **nvm**, the Node version manager:

\`\`\`sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
\`\`\`

Close and reopen the terminal, then:

\`\`\`sh
nvm install 22
node --version
\`\`\`

It should print \`v22\` and a version number. (You can also use the installer from [nodejs.org](https://nodejs.org).)

2. **Make a project** and install TypeScript into it. \`--save-dev\` records it as a tool for building, not something the page needs at run time:

\`\`\`sh
mkdir -p ~/aws-study-projects/typescript/flashcards
cd ~/aws-study-projects/typescript/flashcards
npm init -y
npm install --save-dev typescript
\`\`\`

3. **Download the three files** with the buttons below into that folder, or copy \`app.ts\`, \`index.html\` and \`style.css\` from the last step.

4. **Tell the compiler how to work** with a file called \`tsconfig.json\`. (\`npx tsc --init\` writes one with every option explained in comments; for this page, a short one is clearer.)

\`\`\`json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "strict": true
  },
  "files": ["app.ts"]
}
\`\`\`

5. **Compile.** \`npx\` runs the TypeScript installed in this project. It checks \`app.ts\` and writes \`app.js\` next to it:

\`\`\`sh
npx tsc
\`\`\`

No output means no errors. Try breaking something on purpose (write \`card.fornt\`) and run it again to see the error in your own terminal.

6. **Open the page.** \`open index.html\` on a Mac, \`xdg-open index.html\` on Linux, or \`explorer.exe index.html\` in the Windows Subsystem for Linux.

7. **While you work**, let the compiler watch for changes and recompile on every save:

\`\`\`sh
npx tsc --watch
\`\`\`

Press Ctrl+C to stop it. Editors like Visual Studio Code run the same checks as you type, with red underlines.

8. **Push to GitHub** (see *Start here*). Add a \`.gitignore\` with \`node_modules/\` and \`app.js\`: anyone can rebuild them from \`package.json\` and \`app.ts\` with \`npm install\` and \`npx tsc\`.

**Cost:** nothing. Everything here runs on your own computer.`,
      downloads: [
        { label: 'Download app.ts', filename: 'app.ts', content: () => `${GUARD_SOLUTION}\n` },
        { label: 'Download index.html', filename: 'index.html', content: () => `${PAGE_HTML}\n` },
        { label: 'Download style.css', filename: 'style.css', content: () => `${PAGE_CSS}\n` },
      ],
      checklist: [
        'Node.js 22 and TypeScript are installed (`node --version`, `npx tsc --version`)',
        '`npx tsc` compiles app.ts with no errors, in strict mode',
        'The page works when I open index.html, and my progress survives a reload',
        'A typo like `card.fornt` makes `npx tsc` fail',
        'The project is on GitHub, with node_modules and app.js in .gitignore',
      ],
    },
  ],
};

export default tutorial;
