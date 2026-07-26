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

The existing `POST /attempts/:attemptId/submit` workflow remains a
`basic-v1` completion estimate for recorder compatibility. The learner session
also posts the same uploaded recordings to `/submissions` first, then displays
that persisted `speaking-v2` IELTS report without changing either existing
attempt endpoint.

## Provider-backed speaking reports

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/submissions` | Learner | Analyse one part or a complete three-part mock test |
| GET | `/submissions/:id` | Submission owner | Read recordings and persisted part/mock reports |

`POST /submissions` accepts durable audio references grouped by IELTS part.
Use `mode: "part"` with one part or `mode: "mock"` with Parts 1, 2, and 3.
An upstream trusted transcript may be supplied during migration; otherwise the
speech-to-text provider receives the audio URL/key.

```json
{
  "mode": "part",
  "testId": "optional-speaking-test-id",
  "parts": [
    {
      "partNumber": 2,
      "questionMetadata": {
        "topic": "Travel",
        "expectedDurationSeconds": 120
      },
      "recordings": [
        {
          "responseKey": "part2-main",
          "audioStorageKey": "speaking/user-1/part2.webm",
          "durationSeconds": 118
        }
      ]
    }
  ]
}
```

The service calls these provider ports: speech-to-text, grammar analysis,
pronunciation analysis, and response relevance. The pure
[`speakingAlgorithm.ts`](../src/modules/speaking/algorithm/speakingAlgorithm.ts)
then calculates fluency, vocabulary, filler penalties, the four core IELTS
criteria, a relevance penalty on the final half-band, CEFR, strengths, weak
areas, and rule-based recommendations. It never calls an API, database,
Fastify, or an AI SDK. Low relevance reduces the final band but never erases
the individual language scores; Band 0 is reserved for no usable speech.

Primary production configuration uses:

- `DEEPGRAM_API_KEY` (and optional `DEEPGRAM_MODEL`) for transcription
- `GEMINI_API_KEY` (and optional `GEMINI_MODEL`) for grammar, audio-assisted
  pronunciation feedback, and response relevance
- optional `SPEAKING_INTERNAL_API_URL` to load app-owned `/uploads/audio/*`
  recordings from the API process

Deepgram returns the transcript and confidence. Gemini returns structured
`{ score, errors, suggestions }`,
`{ score, confidenceScore, mispronouncedWords, supported }`, and
`{ score, answeredQuestion, relevance, reason, missingPoints }` data. Gemini
failures use documented neutral analysis values, so a temporary guidance outage
does not prevent the deterministic report or invent a relevance penalty.

Generic JSON adapters remain available for custom deployments through
`SPEAKING_STT_ENDPOINT`, `SPEAKING_GRAMMAR_ENDPOINT`, and
`SPEAKING_PRONUNCIATION_ENDPOINT` with their corresponding API-key variables.

Migration `20260724090000_add_ai_speaking_evaluations` adds
`SpeakingSubmission`, `SpeakingRecording`, `SpeakingEvaluation`, and
`SpeakingReport`. Each part gets its own report; a mock submission also stores
a combined `mock` report. Migration
`20260726090000_add_speaking_response_relevance` adds queryable relevance and
speech-to-text confidence fields while retaining the complete report JSON.
