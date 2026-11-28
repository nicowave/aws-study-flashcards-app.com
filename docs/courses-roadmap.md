# Courses roadmap: December 2026

Living tracker for getting the Level Up Study Hub courses (`aws-coding-courses/`) as complete as possible **before 25 December 2026**, so that in 2027 the platform stands next to others with similar content, made for a narrower audience: people learning to code in order to work with AWS.

- **How to update this file:** when a pull request opens, write its number next to the item; when it merges, tick the item and add the date. Anything unfinished, untested or uncertain is said in the item, not left out.
- **To change the priorities:** edit the order in "Priority order" below (or comment on the pull request). Work follows this file as it is on `main` that day.

Legend: `[ ]` to do · `[~]` in a pull request · `[x]` merged · **Code** = a pull request in this repo · **Owner** = only Nico can do it (deploys from the Mac, Stripe, AWS resources).

## Where things stand

Checked against `main` on 2026-11-28 (commit `69c1172`).

| Course | Tutorials on `main` | Hours shown | Live | In flight (other session) |
|---|---|---|---|---|
| Bash for AWS | 5 (+ Start here) | 14 | yes | none |
| Python for AWS | 5 (+ Start here) | 21 | yes | none |
| JavaScript for AWS | 5 (+ Start here) | 24 | yes | none |
| TypeScript for AWS | 3 (+ Start here) | 14 | yes | TypeScript 4 |
| Tech Spanish ↔ Tech English | 8 modules + Start here | 8 | **no** (written; launch waits on the owner) | none |

**In flight, not to be written twice.** Bash 5, Python 5 and JavaScript 5 are written, tested and reviewed, and arrive with the pull request that made this edit (branch `claude/confident-franklin-osujab`, 2026-11-28); the three rows above show the course as it is once that merges. TypeScript 4 is still being written in that other session: its first author run was cut off before the tutorial file existed, so it is not in that pull request. Do not write it twice.

- [x] Bash 5: "Deploy many sites, and tell the truth" (multi-site deploy, honest summary, testing with a pretend `aws`)
- [x] Python 5: "Summarize support tickets with Amazon Bedrock" (adds a pretend `bedrock-runtime` client to the practice engine)
- [x] JavaScript 5: "Photo uploads without a server" (presigned URLs; adds a pretend `@aws-sdk/s3-request-presigner`, S3 over the pretend `fetch`, and file inputs in page probes)
- [ ] TypeScript 4: a typed API, end to end

Tutorials below are numbered after these. If one of them changes scope, the tutorial after it is re-checked for overlap before it is written.

## What "finished" means

A course is finished for December when its tutorials take a learner from the first line to work they could show an employer, with no gap that a comparable general course fills and this one skips. Every tutorial keeps the house format: practice steps with checks, exam tips, a quiz, flashcards and a "Build it for real" step on the learner's own AWS account.

"Comparable courses" below means the usual syllabus of general-purpose beginner courses in that language and of AWS's own developer training; it is a judgement from their public outlines, not a line-by-line audit.

### Bash for AWS — finished at 8 tutorials

Has: commands, pipes, variables, `if`, loops, exit codes, cron, `grep`/`awk`/`sort`/`uniq`/`cut`, functions, `tar`, `set -euo pipefail`, `jq`, S3, CloudFront, Secrets Manager.

Comparable courses also cover, and this one does not yet: arrays, `case` and option parsing; `sed`, `find` and `xargs`; file permissions and users; working on a remote server over SSH; processes, signals and `trap`. On the AWS side: EC2 from the command line, `--query`, CloudWatch Logs.

| # | Tutorial | Why | Practice-engine needs |
|---|---|---|---|
| 5 | Deploy many sites, and tell the truth | Done 2026-11-28 | Added: commands found through `PATH`, indexed arrays, `case`, exported variables, Bash 5.2's `set -e` rules |
| 6 | **The server fleet report**: list EC2 instances, find the untagged and the forgotten, stop the dev ones at night | EC2 is the service every AWS job touches and the course has none; teaches arrays, `case`, `getopts` and `--query` | Pretend `aws ec2 describe-instances / stop-instances / create-tags`; the tiny `--query` reader may need filters (`[?…]`). Must run on Bash 3.2 (the Mac): no associative arrays |
| 7 | **First day on a new server**: a setup script that is safe to run twice (users, permissions, a config file edited in place, a service started) | Permissions, `sed`, `find`/`xargs` and here-documents are the biggest gap against any general Bash course; "safe to run twice" is what makes a script a tool | `chmod`/`chown` with visible modes in `ls -l`, `sed -i`, `find`, `xargs`, a pretend `systemctl`; likely the largest engine job on this list |
| 8 | **Watch the logs from your desk**: search CloudWatch Logs, send your own metric, clean up after yourself with `trap` | Closes the loop from tutorial 2 (logs on a disk) to where logs live on AWS; `trap` and temp files finish the "safe scripts" thread | Pretend `aws logs filter-log-events / tail`, `aws cloudwatch put-metric-data`; `trap`, `mktemp` |

### Python for AWS — finished at 8 tutorials

Has: values, text, lists, dictionaries, loops, functions, files, CSV, dates, boto3 (STS, EC2, S3, SNS, DynamoDB), paginators, error handling, HTTP, certificates, Lambda handlers, event-driven code, idempotency.

Comparable courses also cover, and this one does not yet: automated tests; classes and dataclasses; modules, packages, virtual environments and `pip`; type hints; logging; command-line arguments. On the AWS side: queues (SQS), retries and dead-letter queues.

| # | Tutorial | Why | Practice-engine needs |
|---|---|---|---|
| 5 | Summarize support tickets with Amazon Bedrock | Done 2026-11-28 | Added: pretend `bedrock-runtime` (Converse), `practice.aws.checkpoint()` / `restore()` |
| 6 | **Test it before it ships**: tests for the upload pipeline's checks, a pretend AWS in the tests, logs you can read at 3 a.m. | Testing is the largest single gap against comparable courses, and employers ask for it first | `unittest` and `unittest.mock` ship with Python, so possibly none; to confirm: test output shown clearly, and a check that can tell passing tests from no tests |
| 7 | **A queue between two jobs**: SQS between the upload and the slow work, retries, a dead-letter queue, partial batch failures; messages as dataclasses | Queues are how AWS systems survive failure and a staple of the Developer Associate exam; dataclasses and type hints arrive with a real use | Pretend `sqs` client in `practice_aws.py` (send, receive, delete, visibility timeout, redrive) and SQS events for `invoke` |
| 8 | **Your own tool, packaged**: turn the scripts into one command with `argparse`, modules, a virtual environment and `pip install` | The step from "scripts" to "a tool a colleague can install"; covers modules and packaging, which every general course has | Several files importing each other (to confirm), command-line arguments for a run; `pip` and virtual environments are taught in "Build it" only |

### JavaScript for AWS — finished at 8 tutorials

Has: HTML/CSS/JS, the DOM, events, JSON, `localStorage`, `fetch`, Promises, `async`/`await`, timers, retries, forms, Lambda handlers for HTTP, CORS, JSON Web Tokens, Cognito, DynamoDB, SES.

Comparable courses also cover, and this one does not yet: automated tests; array methods in depth (`map`/`filter`/`reduce`, sorting, grouping); modules and npm; classes; a front-end framework (React). On the AWS side: DynamoDB data modelling (queries, indexes, pages), scheduled jobs.

| # | Tutorial | Why | Practice-engine needs |
|---|---|---|---|
| 5 | Photo uploads without a server (presigned URLs) | Done 2026-11-28 | Added: pretend presigner, S3 over `fetch`, `practice.chooseFile` |
| 6 | **Test the API before your users do**: tests for the contact-form and study-tracker handlers, every status code, a pretend DynamoDB | Same gap as Python: no testing anywhere in the course | `node:test` and `node:assert` in the node runtime (neither is importable today); test results in the check |
| 7 | **Design the data: one table, many questions**: keys, `Query`, an index, pages with `LastEvaluatedKey`, shaping results with `map`/`filter`/`reduce` | Tutorials 3–4 use DynamoDB one item at a time; real apps need modelling, and array methods get a full workout | `QueryCommand` with a global secondary index and paging in the pretend DynamoDB (to confirm what exists) |
| 8 | **The weekly digest**: a scheduled Lambda that reads the week's activity and emails each person a summary | Scheduled, no-user-waiting code is the other half of serverless; uses modules, dates and SES together | A scheduled (EventBridge Scheduler) event for `invoke`; SES exists. Probably small |

React is not a tutorial here: it is a course of its own, decided 2026-11-28 (see "React for AWS" below).

### TypeScript for AWS — finished at 7 tutorials

Has: annotations, interfaces, unions, optional properties, strict null checks, type guards, generics, async iteration, exhaustive `switch`, the AWS SDK v3, classes, the CDK, CI/CD.

Comparable courses also cover, and this one does not yet: `unknown` and validating data at run time; utility types (`Pick`, `Omit`, `Partial`, `Record`), `satisfies`, `as const`; testing typed code; typed errors. On the AWS side: testing a CDK stack, typed events between services.

| # | Tutorial | Why | Practice-engine needs |
|---|---|---|---|
| 4 | A typed API, end to end | In flight, not in a pull request yet | (other session) |
| 5 | **Never trust input**: `unknown`, a small validator whose types come from the schema, utility types, `satisfies` | Types vanish at run time: the lesson every TypeScript learner meets in production. **Overlap risk with TypeScript 4**; scope is fixed only after that one is readable | None expected |
| 6 | **Test the stack**: assertions on the CDK template (no public bucket, the right table keys) and handler tests | The CDK tutorial deploys untested infrastructure; this is what a team reviews before `cdk deploy` | Pretend `aws-cdk-lib/assertions` (`Template.fromStack`, `hasResourceProperties`, `resourceCountIs`); `node:test` from JavaScript 6, so it comes after it |
| 7 | **Events and queues, typed**: one event shape shared by sender and receiver, SQS between two Lambdas, defined in the CDK | Discriminated unions earn their keep across a service boundary; adds the queue pattern to this course | Pretend `@aws-sdk/client-sqs`, CDK `sqs.Queue` and `SqsEventSource`, SQS events for `invoke` |

### Tech Spanish ↔ Tech English — finished when it is live

All 8 modules and Start here are written. What is left is the launch, in `docs/launch-tech-spanish.md`; every step there creates AWS or Stripe resources or deploys, so every step is the owner's.

- [x] **Code:** pre-launch read of all 9 modules as a learner in both interface languages, in a real browser. Done 2026-11-28 (#100): no wrong answers, AWS facts or crashes; a quiz that lost its options to Markdown and several writing checks fixed. Not checked: sign-in, checkout and saved progress with a real account, Safari, a native reader from each region.
- [ ] **Owner, before launch:** the judgement calls listed in #100: the unlock card says "All 8 modules" and lists 7 while `pricingLede` says nine; writing steps check key terms only (say so in the step?); *cachear* is team talk in Module 2 and slang in Module 8; flashcards show internal tags in English.
- [ ] **Owner:** create the site (`create-course-site.mjs --from typescript --to spanish --apply`)
- [ ] **Owner:** Stripe prices in `aws-backend/.env`, then `cdk deploy`
- [ ] **Owner:** share image, `./deploy.sh hub`, `./deploy.sh spanish`
- [ ] **Code, after the owner's steps:** flip `live: true` (hub `courses.js`, `courseSites.js`, `llms.txt`), as step 5 of the launch doc says

### React for AWS — a new course, 2027 or earlier

Decided by the owner on 2026-11-28: React becomes its own course, in 2027 or sooner if December allows. It follows JavaScript for AWS (and uses TypeScript for AWS where types help), for the learner who can build a page and an API and now needs what most front-end job postings ask for.

Nothing is written yet, and the outline below is a first proposal, not a plan the owner has seen.

| # | Tutorial (proposed) | Why |
|---|---|---|
| 1 | The flashcard page again, as components (free) | Same app the learner already built, so the only new thing is React: JSX, props, state |
| 2 | Data from an API: effects, loading and error states | The status dashboard's lessons, the React way |
| 3 | Forms, sign-in with Cognito and protected pages | What every real app has |
| 4 | Ship it: build, S3 + CloudFront, a pipeline | Hosting a single-page app is where AWS comes in (routing fallbacks, cache rules) |

**What it needs before a tutorial can be written:**

- **Code:** a `react` practice runtime. Today's web runtime runs classic scripts only (no modules, no JSX), so this means compiling JSX in the browser (the TypeScript compiler already in the engine can do it) and loading React into the sandboxed page, with the same probe and check shape as `web`. This is the largest engine job on this page; the first step is a short trial to find out how large.
- **Code:** a course folder, site id and plan wired the way Tech Spanish was (backend lists, `deploy.sh`, hub card as "coming soon").
- **Owner:** the name (`react.`), the site (`create-course-site.mjs`), Stripe prices, `cdk deploy`, deploys.

## Priority order

One tutorial per pull request, top to bottom. If December runs out, what is above the line reached is done and the rest carries into January. Twelve tutorials is more than four weeks will hold at three passes each (author, independent tester, fact-checking reviewer); **a realistic reach is the first six to eight.**

Rules behind the order: the biggest gap against comparable courses first (testing); no course left behind (TypeScript is the shortest); engine-heavy tutorials later; two tutorials that change the same part of the practice engine never run at the same time.

| # | Item | Course | Engine work | State |
|---|---|---|---|---|
| 0 | Tutorials in flight (Bash 5, Python 5, JavaScript 5, TypeScript 4) | all | other session | [x] Bash 5, Python 5, JavaScript 5 (pull request from `claude/confident-franklin-osujab`) · [ ] TypeScript 4 still being written |
| 1 | Python 6: Test it before it ships | Python | `unittest.main()`, clean logging per run, Lambda-style log lines | [~] #102 |
| 2 | TypeScript 5: Never trust input | TypeScript | none | [ ] waits for TypeScript 4 to be readable |
| 3 | JavaScript 6: Test the API before your users do | JavaScript | `node:test`, `node:assert` | [ ] |
| 4 | Bash 6: The server fleet report | Bash | pretend `aws ec2` | [ ] |
| 5 | Tech Spanish pre-launch read | Tech Spanish | none | [x] 2026-11-28 (#100) |
| 6 | Python 7: A queue between two jobs | Python | pretend `sqs` (Python) | [ ] |
| 7 | TypeScript 6: Test the stack | TypeScript | CDK assertions | [ ] after item 3 |
| 8 | JavaScript 7: Design the data | JavaScript | DynamoDB `Query` + index | [ ] |
| 9 | Bash 7: First day on a new server | Bash | permissions, `sed`, `find`, `xargs` | [ ] |
| 10 | TypeScript 7: Events and queues, typed | TypeScript | pretend `sqs` (JS), CDK queue | [ ] |
| 11 | Python 8: Your own tool, packaged | Python | arguments for a run | [ ] |
| 12 | Bash 8: Watch the logs from your desk | Bash | pretend `aws logs`, `trap` | [ ] |
| 13 | JavaScript 8: The weekly digest | JavaScript | scheduled event | [ ] |
| 14 | React for AWS: trial of the `react` practice runtime, then the outline for the owner | React (new) | JSX + React in the web runtime | [ ] moves up if the owner wants React before the tutorials above |

## With every tutorial

Each tutorial's pull request also carries, or says why not:

- registration in the course's `index.js`;
- `meta.json` and the course page copy made true (tutorial count in `pricingLede`, hours, description, outcomes, FAQ);
- the count and hours for that course in the hub's `aws-study-homepage/src/data/courses.js`, with the hub's tests run;
- a line in CLAUDE.md for any new practice-engine feature, and a test for it;
- `free: false`, no prices as literals, never "one-time" or "pay once";
- every AWS statement (API names, response shapes, error names, limits, prices, console paths, commands in "Build it") read in the AWS documentation that day;
- `courses.test.js` green (every answer passes its own check, every starter does not).

## Waiting on the owner

- [ ] **Deploy after each merged tutorial:** `./deploy.sh bash|python|js|typescript`, and `./deploy.sh hub` when the hub's counts changed. Nothing in a cloud session can deploy.
- [ ] **Tech Spanish launch:** steps 1–4 of `docs/launch-tech-spanish.md` (listed above).
- [ ] **Priorities:** change the order above if it is wrong.
- [x] **React:** yes, as its own course, 2027 or earlier (2026-11-28).
- [ ] **React, where in the order:** it sits at 14, after the tutorials. Move it up in the table if it should displace some of them in December.

## Found along the way, not fixed

Small things seen while writing or testing, each too small or too far from the tutorial at hand to fix there.

- [~] Python 3, "The alerting Lambda function": could only pass on a first run (#103).
- [ ] The editor's line numbers drift on phones in every course (`.editor-gutter` is missing from the small-screen rule in `aws-coding-courses/src/styles`). From the other session.
- [ ] "Build it" steps outside Bash 4 and 5 may still describe the old CloudFront console and Secrets Manager's former 30-day free trial. From the other session; not yet checked tutorial by tutorial.
- [ ] Lambda's `nodejs22.x` runtime is due to be deprecated on 30 May 2027; JavaScript 3 to 5 use it. From the other session; date not re-read here.
- [ ] No "Build it" step of Bash 5, Python 5, Python 6 or JavaScript 5 has been run on a real AWS account. **Owner**, or anyone with an account.
- [ ] Check messages are shown as plain text, so the backticks every course writes in them appear literally. A `TaskBox` change for all courses.
- [ ] The three phone-width fixes in #102 change CSS every course shares; only the Python site was looked at.

## Not courses, kept here so nothing is lost

From CLAUDE.md, "Open work". Both belong to the certification games and come after the courses.

- [ ] Integrate the AIF-C01 modules into `aws-ai-study-game/src/data/flashcards/`.
- [ ] Integrate the Study Activities Hub (Scenario Lab, Service Sort, Speed Round, Match Up) into the Cloud Practitioner app.

## Log

- 2026-11-28: tracker written. Surveyed `main` and the last 15 pull requests: no in-flight tutorial has landed.
- 2026-11-28: roadmap merged (#98). Owner decided React becomes its own course, 2027 or earlier; added as item 14. Python 6 and the Tech Spanish pre-launch read started.
- 2026-11-28: #99 (React), #100 (Tech Spanish fixes) and #101 (Bash 5, Python 5, JavaScript 5) merged. Python 6 is in #102, a fix for Python 3 in #103. TypeScript 4 is still with the other session, so TypeScript 5 waits. For agents: read the AWS CLI reference; never run a real `aws` program in a session.
