# API contract (v1)

Base URL in development: `http://127.0.0.1:4000/api/v1`

All successful responses use `{ "data": ... }`. Errors use `{ "error": { "code", "message", "details?", "requestId" } }`. Protected endpoints require `Authorization: Bearer <accessToken>`.

## System

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/` | Public | API metadata |
| GET | `/health` | Public | Liveness check |

## Authentication

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create student account and issue token |
| POST | `/auth/login` | Public | Sign in as student |
| POST | `/auth/admin/register` | Public when enabled | Bootstrap an administrator |
| POST | `/auth/admin/login` | Public | Sign in as administrator |
| GET | `/auth/me` | Any signed-in user | Get current account |

Registration expects `name`, `email`, and an 8+ character `password`. Login expects `email` and `password`.

## Tests and authored content

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/tests?skill=writing` | Public | List published tests, optionally by IELTS skill |
| GET | `/tests/:id` | Public | Read one published test |
| GET | `/admin/tests?skill=writing` | Admin | List drafts and published tests, including answer keys |
| POST | `/admin/tests` | Admin | Create a test |
| PATCH | `/admin/tests/:id` | Admin | Update test data |
| PATCH | `/admin/tests/:id/publish` | Admin | Set published state |
| DELETE | `/admin/tests/:id` | Admin | Delete test |

Creating a test accepts:

```json
{
  "skill": "writing",
  "category": "practice",
  "title": "Academic Task 1: Housing",
  "description": "Describe the chart.",
  "content": { "prompt": "...", "imageUrl": "..." },
  "answerKey": { "rubric": "..." },
  "published": false
}
```

`content` is intentionally flexible so existing reading, listening, speaking, and writing shapes can be migrated without forcing one incorrect universal schema. `answerKey` is returned only from administrator endpoints.

## Submissions and reports

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/submissions` | Signed-in learner | Submit an answer; responds `202` while analysis is pending |
| GET | `/submissions` | Signed-in learner | List own attempts |
| GET | `/submissions/:id` | Signed-in learner | Read one own attempt |
| GET | `/reports` | Signed-in learner | List own reports |
| GET | `/reports/:id` | Signed-in learner | Read one own report |

An example submission:

```json
{
  "skill": "writing",
  "testId": "b33fdbdb-4fc1-4551-9011-301f918e833c",
  "responseText": "My essay answer...",
  "timeTakenSeconds": 2350
}
```

The response contains a linked `reportId`. Its report starts as `pending` until an analysis worker is added.
