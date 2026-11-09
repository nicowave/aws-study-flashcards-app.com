# Weekly newsletter

One email a week to everyone on the list: people who signed up with the box on the hub or a game, and people who took the readiness check. Anyone who unsubscribed is skipped.

## Write an issue

1. Copy `issues/_example.md` to `issues/<date>-<topic>.md`, using the Tuesday it should go out, e.g. `issues/2026-11-10-storage-classes.md`.
2. Write it (format below).
3. Run `./deploy.sh newsletter` from the repo root. It uploads every issue in `issues/` and emails a preview of the next one to nico@nico-tek.com. Fix anything and run it again as often as you like.

## When it goes out

- **Monday 9:00 Eastern:** you get a preview of Tuesday's issue, or a reminder that none is queued.
- **Tuesday 9:00 Eastern:** the issue goes to the whole list.

An issue goes out on the first Tuesday on or after its date (if that's within 6 days), and only once. If no issue is queued, nothing is sent that week. To cancel a queued issue, delete or rename its file and run `./deploy.sh newsletter` again.

Files starting with `_` (like the example) are never sent.

## Format

```markdown
---
subject: The subject line
preview: The grey text inboxes show after the subject (optional)
---

# A big title

A paragraph. **Bold**, *italic*, `code` and [a link](https://example.com).

## A section heading

- a bullet
- another bullet

1. a numbered step
2. another step

> A highlighted tip (orange box)

[button: Button text](https://aws-study-flashcards-app.com/#readiness)

![Picture description](https://example.com/picture.png)

---
```

Leave a blank line between blocks. A line with just `---` draws a dividing line. Without a `subject:` line, the `# title` is the subject. Links to our own sites get tracking tags added automatically (`utm_source=newsletter`, `utm_campaign=<file name>`). The unsubscribe link and address footer are added for you.

## By hand

```bash
FN=$(aws cloudformation describe-stacks --stack-name StudyHubBackend --query "Stacks[0].Outputs[?OutputKey=='NewsletterFunctionName'].OutputValue" --output text)
# Preview one issue to any address (sends one copy, marks nothing)
aws lambda invoke --function-name "$FN" --cli-binary-format raw-in-base64-out \
  --payload '{"action":"preview","to":"nico@nico-tek.com","issue":"2026-11-10-storage-classes"}' /dev/stdout
# Send an issue to the whole list right now
aws lambda invoke --function-name "$FN" --cli-binary-format raw-in-base64-out \
  --payload '{"action":"send","issue":"2026-11-10-storage-classes"}' /dev/stdout
```

Code: `aws-backend/lambda/api/newsletter.js` (sender), `leads.js` (sign-up and welcome email), schedules in `aws-backend/lib/study-hub-stack.ts`.
