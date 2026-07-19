# Speaking API

Base URL: `http://localhost:5000/api/speaking`.

The speaking module has separate admin authoring and learner attempt APIs. All
protected requests require `Authorization: Bearer <token>` from
`POST /api/auth/login`.

## Admin APIs

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/mock-tests` | Create a mock, Part 1, Part 2, or Part 3 test |
| GET | `/mock-tests` | List authored tests, including drafts |
| GET | `/mock-tests/:id` | Get full authored test content |
| PATCH | `/mock-tests/:id` | Update a test |
| PATCH | `/mock-tests/:id/publish` | Publish for learners |
| PATCH | `/mock-tests/:id/unpublish` | Remove from learner access |
| DELETE | `/mock-tests/:id` | Delete a test |

The creation payload matches the existing admin speaking model. Its `category`
is one of `mock`, `part-1`, `part-2`, or `part-3`; all part objects are sent,
while only the parts required by that category are validated for publication.

## Learner APIs

| Method | Path | Access | Purpose |
| --- | --- | --- |
| GET | `/tests?category=mock&page=1&limit=12` | Public | List published tests, optionally by mode |
| GET | `/tests/:testId` | Public | Get one published task in the existing frontend shape |
| POST | `/tests/:testId/attempts` | Learner | Start an attempt |
| GET | `/attempts/:attemptId` | Attempt owner | Resume a saved attempt and its recordings |
| PUT | `/attempts/:attemptId/recordings` | Attempt owner | Save the current recording map |
| POST | `/attempts/:attemptId/submit` | Attempt owner | Save final recordings and evaluate |
| GET | `/attempts/:attemptId/result` | Attempt owner | Get the persisted result |

`GET /tests/:testId` returns `{ mode, task }`. `task` is directly usable by
the existing `SpeakingSession`: a full mock includes `part1`, `part2`, and
`part3`, while standalone categories return the matching `SpeakingPart*Task`
shape.

Save recordings in the same shape as the current frontend recorder:

```json
{
  "recordings": {
    "question-id": {
      "audioUrl": "https://storage.example/recordings/answer.webm",
      "durationSeconds": 42
    },
    "part2-main": {
      "audioStorageKey": "speaking/attempt-123/part2.webm",
      "durationSeconds": 105,
      "transcript": "Optional future transcription text"
    }
  }
}
```

The current browser recorder produces temporary `blob:` URLs. Those are fine
for the local UI but cannot be evaluated by a server after the browser session
ends. For production, upload audio first and submit a durable object-storage
URL or `audioStorageKey`.

## Evaluation

[`speakingAlgorithm.ts`](../src/modules/speaking/algorithm/speakingAlgorithm.ts)
contains the current `basic-v1` evaluator. It calculates recording coverage
and duration only, then saves `basicScore`, `estimatedBandScore`, and honest
completion feedback. It is not an IELTS language-quality score.

To add AI later, transcribe durable audio, add an AI evaluator beside the basic
algorithm, and save its results with `evaluationMode: AI`. Keep the basic
result/version so learners and admins can distinguish the two.
