---
subject: The storage-class trap that costs people points
preview: Plus Amazon SQS versus Amazon SNS in two sentences.
---

# The storage-class trap that costs people points

Hi, Nico here. Three quick things this week.

## 1. The exam trap

A question describes data that is "rarely accessed but must be available in milliseconds when needed." Most people pick **S3 Glacier Flexible Retrieval** because it sounds cheap.

Wrong. Flexible Retrieval takes minutes to hours. The answer is **S3 Glacier Instant Retrieval**, or **S3 Standard-Infrequent Access** if the data is read about once a month.

> Rule of thumb: the word "milliseconds" rules out every Glacier class except Instant Retrieval.

## 2. One service in plain English

**Amazon SQS** is a to-do list: one worker takes each message and deletes it when done. **Amazon SNS** is a megaphone: every subscriber hears every message. If the question says "fan out," think SNS (often feeding several SQS queues).

## 3. New on AWS Study Hub

The free 10-question readiness check now emails you a 7-day plan built around your weakest exam areas.

[button: Take the readiness check](https://aws-study-flashcards-app.com/#readiness)

Reply and tell me which exam you're studying for. I read every one.

Nico
