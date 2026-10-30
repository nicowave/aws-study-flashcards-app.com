# Marketing: tracked links, readiness check, share images

## Tracked links (launch week, Oct 31 – Nov 6, 2026)

Use one link per channel so Google Analytics (Reports → Acquisition → Traffic acquisition, "Session source / medium") and the readiness-check emails show where people came from. Links to the hub end in `#readiness` so they land on the free check.

| Where | Link |
|---|---|
| Reddit r/AWSCertifications | https://aws-study-flashcards-app.com/?utm_source=reddit&utm_medium=social&utm_campaign=launch-week&utm_content=awscertifications#readiness |
| Reddit r/learnpython | https://python.aws-study-flashcards-app.com/?utm_source=reddit&utm_medium=social&utm_campaign=launch-week&utm_content=learnpython |
| LinkedIn post | https://aws-study-flashcards-app.com/?utm_source=linkedin&utm_medium=social&utm_campaign=launch-week#readiness |
| LinkedIn / text messages to people you know | https://aws-study-flashcards-app.com/?utm_source=linkedin&utm_medium=dm&utm_campaign=launch-week#readiness |
| Instagram bio link (reels) | https://aws-study-flashcards-app.com/?utm_source=instagram&utm_medium=social&utm_campaign=launch-week#readiness |
| Hacker News (Show HN) | https://bash.aws-study-flashcards-app.com/?utm_source=hackernews&utm_medium=social&utm_campaign=launch-week |
| X | https://aws-study-flashcards-app.com/?utm_source=x&utm_medium=social&utm_campaign=launch-week#readiness |
| Emails to instructors | https://aws-study-flashcards-app.com/?utm_source=instructors&utm_medium=email&utm_campaign=launch-week#readiness |

Already built in: shared scores use `utm_source=share` (`utm_campaign` = `readiness`, `quiz-score` or `exam-score`), and links inside the readiness email use `utm_source=readiness`. The Halloween email uses `utm_source=email`.

A link for a new channel: copy one above and change `utm_source` (the site or person), `utm_medium` (social, email, dm) and `utm_campaign` (the push).

## Readiness check ("Am I ready?")

- Homepage section `#readiness` (`aws-study-homepage/src/components/ReadinessCheck.jsx`). `?check=<cert id>` opens it for one certification.
- Questions: `src/data/readiness.js`, generated from each game's bank by `node scripts/build-readiness.mjs` (10 per certification, split by domain weight).
- Backend: `POST /v1/leads` and `POST /v1/leads/unsubscribe` in `aws-backend/lambda/api/leads.js`. Sends from nico@nico-tek.com through Amazon Simple Email Service; at most 3 emails per address per day.
- Data: DynamoDB items `PK = LEAD#<email>`, `SK = PROFILE` (first source, unsubscribe token, `unsubscribed`) and `SK = CHECK#<time>` (certification, score, domains, source).
- List everyone who took the check and hasn't unsubscribed:

```bash
aws dynamodb scan --table-name "$(aws cloudformation describe-stacks --stack-name StudyHubBackend --query "Stacks[0].Outputs[?OutputKey=='TableName'].OutputValue" --output text)" \
  --filter-expression "begins_with(PK, :p) AND SK = :s AND unsubscribed = :f" \
  --expression-attribute-values '{":p":{"S":"LEAD#"},":s":{"S":"PROFILE"},":f":{"BOOL":false}}' \
  --query 'Items[].[email.S, source.M.utm_source.S, createdAt.S]' --output text
```

Any follow-up email must honor `unsubscribed` and include the unsubscribe link: `https://aws-study-flashcards-app.com/?unsubscribe=<email>&t=<token>`.

### Follow-up emails (launch week)

`aws-backend/lambda/api/campaigns.js`, run by the `LeadEmailsFn` Lambda. Three EventBridge rules in `study-hub-stack.ts` send them at 9:00 Eastern:

| When | Campaign | What it says |
|---|---|---|
| Wed Nov 4 | `day3` | Today's step of their 7-day plan (counted from their latest check), a study tip, the sale price |
| Thu Nov 5 | `48-hours` | The deal ends Friday at midnight Eastern: price, what's in the full game, their score |
| Fri Nov 6 | `last-day` | Last day of the deal; promises no more sale emails |

Who gets them: everyone on the list except people who unsubscribed and people who signed up in the last 24 hours. The two sale emails also skip anyone who already owns that certification (matched through their sign-in email). The sale emails send nothing outside the sale window. Each person gets each email once (`sent_<campaign>` on their PROFILE item), so a retried run continues where it stopped.

Preview one email to one address (sends it, marks nothing, ignores the rules above):

```bash
aws lambda invoke --function-name "$(aws cloudformation describe-stacks --stack-name StudyHubBackend --query "Stacks[0].Outputs[?OutputKey=='LeadEmailsFunctionName'].OutputValue" --output text)" \
  --cli-binary-format raw-in-base64-out --payload '{"campaign":"day3","only":"nico@nico-tek.com","preview":true}' /dev/stdout
```

Each run logs a line like `[campaigns] Done day3 {"sent":42,"skipped":{...}}` in the function's CloudWatch logs. Email links use `utm_source=readiness` with `utm_campaign` = `day3`, `sale-48-hours` or `sale-last-day`.

## Share images

`aws-study-homepage/public/og/<site>.png` (1200×630), one per game and course, built by `node scripts/build-share-images.mjs` (needs Google Chrome). The games' `index.html` and the course template point at them; they ship with the hub (`./deploy.sh hub`).
