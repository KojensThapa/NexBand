# NexBand API

Development base URL: `http://localhost:4000`.

Successful responses use `{ "success": true, "data": ... }`; failures use
`{ "success": false, "message": "..." }`. Authenticated requests send
`Authorization: Bearer <token>` from `POST /api/auth/login`.

## Reading learner flow

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/reading/tests?page=1&limit=12` | Public | List published test cards |
| GET | `/api/reading/tests/:testId` | Public | Get published passages and questions |
| POST | `/api/reading/tests/:testId/attempts` | Signed-in learner | Start a new attempt |
| PUT | `/api/reading/attempts/:attemptId/answers` | Attempt owner | Autosave all current answers |
| POST | `/api/reading/attempts/:attemptId/submit` | Attempt owner | Persist final answers and calculate the score |
| GET | `/api/reading/attempts/:attemptId/result` | Attempt owner | Get the saved score |

The public list uses the frontend card fields (`id`, `title`, `totalMinutes`,
`totalQuestions`, and `tags`). The single-test response uses the existing
`ReadingMockTest` session shape: `totalMinutes`, `passages[].partNumber`,
`passages[].passage`, and `questions[].number`/`prompt`. It never includes
`correctAnswer` or `explanation`.

Start a test:

```http
POST /api/reading/tests/clx.../attempts
Authorization: Bearer <token>
```

The response contains an `attempt` with its ID and an answer-key-free `test`.
Keep the attempt ID for autosave and submission.

Autosave answers as the frontend's `Record<questionId, string>` state:

```json
{
  "answers": {
    "clx-question-1": "TRUE",
    "clx-question-2": "B. The brain strengthens learning connections"
  }
}
```

Submitting may include the latest local answer map too, which is merged with
the saved answers before scoring. Submitting a second time is safe: it returns
the already persisted result instead of creating another one.

```json
{
  "answers": {
    "clx-question-3": "NOT GIVEN"
  }
}
```

The result records `correctAnswers`, `rawScore`, `totalMarks`, `percentage`,
and `bandScore`. `basic-v1` gives each question its configured marks, compares
answers case- and whitespace-insensitively, and estimates a 0–9 band rounded
to the nearest half band. It is deliberately a basic provisional estimate, not
an official IELTS conversion table.

## Reading authoring endpoints

These are for admins only and include answer keys where needed.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/reading/mock-tests` | Create a three-passage reading test |
| GET | `/api/reading/mock-tests` | List all authored tests |
| GET | `/api/reading/mock-tests/:id` | Get one authored test |
| PATCH | `/api/reading/mock-tests/:id` | Update a test |
| DELETE | `/api/reading/mock-tests/:id` | Delete a test |
| PATCH | `/api/reading/mock-tests/:id/publish` | Publish a test |
| PATCH | `/api/reading/mock-tests/:id/unpublish` | Remove a test from learner access |

Run `npx prisma migrate deploy` in the backend directory before using attempt
routes against a deployed database.
