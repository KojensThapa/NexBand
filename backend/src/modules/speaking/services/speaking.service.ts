import { SpeakingFeedbackService } from "../../../services/speaking/SpeakingFeedbackService";
import { evaluateSpeaking } from "../algorithm/speakingAlgorithm";
import type {
  GrammarAnalysis,
  PronunciationAnalysis,
  QuestionMetadata,
  ResponseRelevanceAnalysis,
  SpeakingEvaluationResult,
} from "../algorithm/types";
import { createLocalUploadAudioResolver } from "../providers/audioSource.provider";
import { GeminiJsonClient } from "../providers/geminiJson.provider";
import {
  GeminiGrammarProvider,
  HttpGrammarProvider,
  UnconfiguredGrammarProvider,
  type GrammarProvider,
} from "../providers/grammar.provider";
import {
  GeminiPronunciationProvider,
  HttpPronunciationProvider,
  UnconfiguredPronunciationProvider,
  type PronunciationProvider,
} from "../providers/pronunciation.provider";
import {
  GeminiResponseRelevanceProvider,
  NeutralResponseRelevanceProvider,
  type ResponseRelevanceProvider,
} from "../providers/responseRelevance.provider";
import {
  DeepgramSpeechToTextProvider,
  HttpSpeechToTextProvider,
  SpeakingProviderError,
  TranscriptFallbackSpeechToTextProvider,
  type SpeechToTextProvider,
} from "../providers/speechToText.provider";
import {
  SpeakingEvaluationRepository,
  type RecordingProviderEvaluation,
  type SpeakingEvaluationRepositoryPort,
} from "../repository/speaking.repository";
import type { CreateSpeakingSubmissionInput } from "../speaking.schemas";

export interface SpeakingProviders {
  speechToText: SpeechToTextProvider;
  grammar: GrammarProvider;
  pronunciation: PronunciationProvider;
  /** Optional keeps custom/legacy dependency-injection adapters compatible. */
  responseRelevance?: ResponseRelevanceProvider;
}

interface ProcessedRecording {
  recordingId: string;
  partNumber: 1 | 2 | 3;
  durationSeconds: number;
  transcript: string;
  grammar: GrammarAnalysis;
  pronunciation: PronunciationAnalysis;
  responseRelevance: ResponseRelevanceAnalysis;
  speechToTextConfidence?: number;
}

interface ProcessedPart {
  report: SpeakingEvaluationResult;
  recordings: ProcessedRecording[];
  grammar: GrammarAnalysis;
  pronunciation: PronunciationAnalysis;
  responseRelevance: ResponseRelevanceAnalysis;
  durationSeconds: number;
  questionMetadata: QuestionMetadata;
}

type SubmissionPart = CreateSpeakingSubmissionInput["parts"][number];

function isPartComplete(part: SubmissionPart): boolean {
  const expectedQuestionIds = part.questionMetadata.questionIds;
  if (expectedQuestionIds?.length) {
    const submittedResponseKeys = new Set(part.recordings.map((recording) => recording.responseKey));
    return expectedQuestionIds.every((questionId) => submittedResponseKeys.has(questionId));
  }
  const expectedQuestionCount = part.questionMetadata.questionCount ?? part.recordings.length;
  return part.recordings.length >= expectedQuestionCount;
}

function withCompletionStatus(
  report: SpeakingEvaluationResult,
  isComplete: boolean
): SpeakingEvaluationResult {
  return { ...report, status: isComplete ? "COMPLETED" : "INCOMPLETE" };
}

export class SpeakingServiceError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = "SpeakingServiceError";
  }
}

function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error && typeof error.code === "string" ? error.code : undefined;
  return code === "P1001" || code === "P1002" || code === "P1008" || code === "P1017";
}

/** Builds Deepgram/Gemini adapters while retaining generic custom-provider support. */
export function createSpeakingProvidersFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env
): SpeakingProviders {
  const apiBaseUrl =
    environment.SPEAKING_INTERNAL_API_URL ??
    `http://127.0.0.1:${environment.PORT ?? "5000"}`;
  const localUploadAudioResolver = createLocalUploadAudioResolver(apiBaseUrl);
  const geminiClient = environment.GEMINI_API_KEY
    ? new GeminiJsonClient({ apiKey: environment.GEMINI_API_KEY, model: environment.GEMINI_MODEL })
    : undefined;
  const speechToTextDelegate = environment.DEEPGRAM_API_KEY
    ? new DeepgramSpeechToTextProvider({
        apiKey: environment.DEEPGRAM_API_KEY,
        model: environment.DEEPGRAM_MODEL,
        localUploadAudioResolver,
      })
    : environment.SPEAKING_STT_ENDPOINT
      ? new HttpSpeechToTextProvider({
          endpoint: environment.SPEAKING_STT_ENDPOINT,
          apiKey: environment.SPEAKING_STT_API_KEY,
        })
      : undefined;
  return {
    speechToText: new TranscriptFallbackSpeechToTextProvider(speechToTextDelegate),
    grammar: geminiClient
      ? new GeminiGrammarProvider(geminiClient)
      : environment.SPEAKING_GRAMMAR_ENDPOINT
        ? new HttpGrammarProvider({
            endpoint: environment.SPEAKING_GRAMMAR_ENDPOINT,
            apiKey: environment.SPEAKING_GRAMMAR_API_KEY,
          })
        : new UnconfiguredGrammarProvider(),
    pronunciation: geminiClient
      ? new GeminiPronunciationProvider(geminiClient, localUploadAudioResolver)
      : environment.SPEAKING_PRONUNCIATION_ENDPOINT
        ? new HttpPronunciationProvider({
            endpoint: environment.SPEAKING_PRONUNCIATION_ENDPOINT,
            apiKey: environment.SPEAKING_PRONUNCIATION_API_KEY,
          })
        : new UnconfiguredPronunciationProvider(),
    responseRelevance: geminiClient
      ? new GeminiResponseRelevanceProvider(geminiClient)
      : new NeutralResponseRelevanceProvider(),
  };
}

function weightedAverage(values: Array<{ value: number; weight: number }>): number {
  const totalWeight = values.reduce((total, item) => total + item.weight, 0);
  if (totalWeight === 0) return 0;
  return values.reduce((total, item) => total + item.value * item.weight, 0) / totalWeight;
}

function aggregateGrammar(recordings: ProcessedRecording[]): GrammarAnalysis {
  return {
    score: weightedAverage(recordings.map((recording) => ({ value: recording.grammar.score, weight: recording.durationSeconds }))),
    errors: recordings.flatMap((recording) => recording.grammar.errors),
    suggestions: [...new Set(recordings.flatMap((recording) => recording.grammar.suggestions))],
  };
}

function aggregatePronunciation(recordings: ProcessedRecording[]): PronunciationAnalysis {
  return {
    score: weightedAverage(recordings.map((recording) => ({ value: recording.pronunciation.score, weight: recording.durationSeconds }))),
    confidenceScore: weightedAverage(
      recordings.map((recording) => ({ value: recording.pronunciation.confidenceScore, weight: recording.durationSeconds }))
    ),
    mispronouncedWords: recordings.flatMap((recording) => recording.pronunciation.mispronouncedWords),
    supported: recordings.every((recording) => recording.pronunciation.supported),
  };
}

function relevanceForScore(score: number): ResponseRelevanceAnalysis["relevance"] {
  if (score <= 3) return "LOW";
  if (score >= 7) return "HIGH";
  return "MEDIUM";
}

function aggregateResponseRelevance(recordings: ProcessedRecording[]): ResponseRelevanceAnalysis {
  const score = weightedAverage(
    recordings.map((recording) => ({ value: recording.responseRelevance.score, weight: recording.durationSeconds }))
  );
  const lowRelevance = recordings.filter(
    (recording) => recording.responseRelevance.score <= 5 || !recording.responseRelevance.answeredQuestion
  );
  return {
    score,
    answeredQuestion: lowRelevance.length === 0,
    relevance: relevanceForScore(score),
    reason:
      lowRelevance.length === 0
        ? "Recorded responses address their associated examiner questions."
        : lowRelevance.map((recording) => recording.responseRelevance.reason).filter(Boolean).join(" "),
    missingPoints: [...new Set(lowRelevance.flatMap((recording) => recording.responseRelevance.missingPoints))],
  };
}

function aggregateSpeechToTextConfidence(recordings: ProcessedRecording[]): number | undefined {
  const values = recordings
    .filter((recording): recording is ProcessedRecording & { speechToTextConfidence: number } =>
      recording.speechToTextConfidence !== undefined
    )
    .map((recording) => ({ value: recording.speechToTextConfidence, weight: recording.durationSeconds }));
  return values.length > 0 ? weightedAverage(values) : undefined;
}

function neutralGrammarAnalysis(): GrammarAnalysis {
  return {
    score: 5,
    errors: [],
    suggestions: ["Grammar AI analysis was unavailable, so a neutral grammar estimate was used."],
  };
}

function neutralPronunciationAnalysis(): PronunciationAnalysis {
  return { score: 5, confidenceScore: 0, mispronouncedWords: [], supported: false };
}

function neutralResponseRelevanceAnalysis(): ResponseRelevanceAnalysis {
  return {
    score: 6,
    answeredQuestion: true,
    relevance: "MEDIUM",
    reason: "Response relevance AI analysis was unavailable, so no relevance penalty was applied.",
    missingPoints: [],
  };
}

async function withFallback<T>(operation: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await operation();
  } catch {
    // AI guidance must not make an otherwise valid speaking attempt fail.
    return fallback();
  }
}

function combineQuestionMetadata(part: {
  questionMetadata: QuestionMetadata;
  recordings: Array<{ questionMetadata: QuestionMetadata }>;
}): QuestionMetadata {
  const recordingMetadata = part.recordings.map((recording) => recording.questionMetadata);
  const questionIds = [...new Set(recordingMetadata.flatMap((metadata) => metadata.questionIds ?? []))];
  const firstTopic = recordingMetadata.map((metadata) => metadata.topic).find((topic): topic is string => Boolean(topic));
  const prompts = [...new Set(recordingMetadata.map((metadata) => metadata.prompt).filter((prompt): prompt is string => Boolean(prompt)))];
  const expectedDuration = recordingMetadata.reduce(
    (total, metadata) => total + (metadata.expectedDurationSeconds ?? 0),
    0
  );
  const recordingQuestionCount = recordingMetadata.reduce(
    (total, metadata) => total + (metadata.questionCount ?? 0),
    0
  );

  return {
    ...part.questionMetadata,
    ...(questionIds.length > 0 ? { questionIds } : {}),
    ...(part.questionMetadata.topic || !firstTopic ? {} : { topic: firstTopic }),
    ...(part.questionMetadata.prompt || prompts.length === 0 ? {} : { prompt: prompts.join("\n") }),
    ...(part.questionMetadata.expectedDurationSeconds || expectedDuration === 0
      ? {}
      : { expectedDurationSeconds: expectedDuration }),
    questionCount: part.questionMetadata.questionCount ?? (recordingQuestionCount || part.recordings.length),
  };
}

function toProviderPersistence(recording: ProcessedRecording): RecordingProviderEvaluation {
  return {
    recordingId: recording.recordingId,
    partNumber: recording.partNumber,
    transcript: recording.transcript,
    grammarScore: recording.grammar.score,
    pronunciationScore: recording.pronunciation.score,
    pronunciationConfidence: recording.pronunciation.confidenceScore,
    grammarErrors: recording.grammar.errors,
    grammarSuggestions: recording.grammar.suggestions,
    mispronouncedWords: recording.pronunciation.mispronouncedWords,
    responseRelevance: recording.responseRelevance,
    ...(recording.speechToTextConfidence === undefined
      ? {}
      : { speechToTextConfidence: recording.speechToTextConfidence }),
  };
}

/**
 * Coordinates the only external/AI-facing work. The algorithm receives only
 * transcript, provider analyses, duration, part number, and question metadata.
 */
export class SpeakingService {
  constructor(
    private readonly repository: SpeakingEvaluationRepositoryPort = new SpeakingEvaluationRepository(),
    private readonly providers: SpeakingProviders = createSpeakingProvidersFromEnvironment(),
    private readonly speakingFeedbackService: SpeakingFeedbackService = new SpeakingFeedbackService()
  ) {}

  async submit(userId: string, input: CreateSpeakingSubmissionInput) {
    let submissionId: string | undefined;

    try {
      const submission = await this.repository.startSubmission(userId, input);
      submissionId = submission.id;
      const recordingIdByResponse = new Map(
        submission.recordings.map((recording) => [`${recording.partNumber}:${recording.responseKey}`, recording.id])
      );
      const parts = await Promise.all(
        input.parts.map(async (part): Promise<ProcessedPart> => {
          const recordings = await Promise.all(
            part.recordings.map(async (recording): Promise<ProcessedRecording> => {
              const recordingId = recordingIdByResponse.get(`${part.partNumber}:${recording.responseKey}`);
              if (!recordingId) throw new SpeakingServiceError("Submitted recording could not be persisted.", 500);

              const audio = {
                ...(recording.audioUrl ? { audioUrl: recording.audioUrl } : {}),
                ...(recording.audioStorageKey ? { audioStorageKey: recording.audioStorageKey } : {}),
                ...(recording.mimeType ? { mimeType: recording.mimeType } : {}),
                ...(recording.transcript ? { transcript: recording.transcript } : {}),
              };
              const transcription = await this.providers.speechToText.transcribe({
                audio,
                language: "en",
                correlationId: submission.id,
              });
              const transcript = transcription.transcript.trim();
              if (!transcript) throw new SpeakingServiceError("Speech-to-text returned an empty transcript.", 422);

              const question = recording.questionMetadata.prompt ?? part.questionMetadata.prompt ?? "";
              const [grammar, pronunciation, responseRelevance] = await Promise.all([
                withFallback(
                  () => this.providers.grammar.analyze({ transcript, language: "en", correlationId: submission.id }),
                  neutralGrammarAnalysis
                ),
                withFallback(
                  () => this.providers.pronunciation.analyze({ audio, transcript, language: "en", correlationId: submission.id }),
                  neutralPronunciationAnalysis
                ),
                this.providers.responseRelevance
                  ? withFallback(
                      () =>
                        this.providers.responseRelevance!.analyze({
                          question,
                          transcript,
                          correlationId: submission.id,
                        }),
                      neutralResponseRelevanceAnalysis
                    )
                  : Promise.resolve(neutralResponseRelevanceAnalysis()),
              ]);

              return {
                recordingId,
                partNumber: part.partNumber,
                durationSeconds: recording.durationSeconds,
                transcript,
                grammar,
                pronunciation,
                responseRelevance,
                ...(transcription.confidence === undefined ? {} : { speechToTextConfidence: transcription.confidence }),
              };
            })
          );
          const grammar = aggregateGrammar(recordings);
          const pronunciation = aggregatePronunciation(recordings);
          const responseRelevance = aggregateResponseRelevance(recordings);
          const speechToTextConfidence = aggregateSpeechToTextConfidence(recordings);
          const durationSeconds = recordings.reduce((total, recording) => total + recording.durationSeconds, 0);
          const questionMetadata = combineQuestionMetadata(part);
          return {
            report: withCompletionStatus(evaluateSpeaking({
              transcript: recordings.map((recording) => recording.transcript).join("\n"),
              durationSeconds,
              grammarAnalysis: grammar,
              pronunciationAnalysis: pronunciation,
              responseRelevanceAnalysis: responseRelevance,
              ...(speechToTextConfidence === undefined
                ? {}
                : { speechToTextConfidence }),
              partNumber: part.partNumber,
              questionMetadata,
            }), isPartComplete(part)),
            recordings,
            grammar,
            pronunciation,
            responseRelevance,
            durationSeconds,
            questionMetadata,
          };
        })
      );

      const allRecordings = parts.flatMap((part) => part.recordings);
      const mockSpeechToTextConfidence = aggregateSpeechToTextConfidence(allRecordings);
      const submissionIsComplete = input.parts.every(isPartComplete);
      const mockReport =
        input.mode === "mock"
          ? withCompletionStatus(evaluateSpeaking({
              transcript: parts.map((part) => part.report.transcript).join("\n"),
              durationSeconds: parts.reduce((total, part) => total + part.durationSeconds, 0),
              grammarAnalysis: aggregateGrammar(allRecordings),
              pronunciationAnalysis: aggregatePronunciation(allRecordings),
              responseRelevanceAnalysis: aggregateResponseRelevance(allRecordings),
              ...(mockSpeechToTextConfidence === undefined
                ? {}
                : { speechToTextConfidence: mockSpeechToTextConfidence }),
              partNumber: "mock",
              questionMetadata: {
                questionCount: parts.reduce((total, part) => total + (part.questionMetadata.questionCount ?? 0), 0),
                prompt: parts.map((part) => part.report.question).filter(Boolean).join("\n\n"),
              },
            }), submissionIsComplete)
          : undefined;

      return await this.repository.completeSubmission(submission.id, {
        status: input.mode === "mock"
          ? (submissionIsComplete ? "COMPLETED" : "INCOMPLETE")
          : parts[0]?.report.status ?? "INCOMPLETE",
        recordingEvaluations: parts.flatMap((part) => part.recordings.map(toProviderPersistence)),
        partReports: parts.map((part) => part.report),
        ...(mockReport ? { mockReport } : {}),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Speaking evaluation failed.";
      if (submissionId) {
        // A database outage can also prevent this write, so never mask the
        // useful service error with a second failed cleanup operation.
        await this.repository.markFailed(submissionId, message).catch(() => undefined);
      }
      if (isDatabaseConnectionError(error)) {
        throw new SpeakingServiceError(
          "The speaking database is temporarily unavailable. Please retry in a moment.",
          503
        );
      }
      if (error instanceof SpeakingServiceError) throw error;
      if (error instanceof SpeakingProviderError) throw new SpeakingServiceError(error.message, error.statusCode);
      throw new SpeakingServiceError("Speaking evaluation failed.", 502);
    }
  }

  async getSubmission(userId: string, submissionId: string) {
    try {
      const submission = await this.repository.findSubmissionForUser(userId, submissionId);
      if (!submission) throw new SpeakingServiceError("Speaking submission not found.", 404);
      return await this.enrichSubmissionReports(submission);
    } catch (error) {
      if (isDatabaseConnectionError(error)) {
        throw new SpeakingServiceError(
          "The speaking database is temporarily unavailable. Please retry in a moment.",
          503
        );
      }
      throw error;
    }
  }

  /**
   * Enriches each persisted report's `evaluationData` (the full
   * SpeakingEvaluationResult JSON blob) with dataset-driven feedback before
   * it reaches the caller. This only touches the read path — the reports
   * were already persisted by `submit()`, exactly as evaluateSpeaking()
   * produced them; nothing about scoring, persistence, or orchestration
   * changes. Any shape this repository port returns that isn't recognizably
   * a reports array (e.g. `null`, or a fake used in a test) is returned
   * unchanged.
   */
  private async enrichSubmissionReports(submission: unknown): Promise<unknown> {
    if (!submission || typeof submission !== "object" || !("reports" in submission)) {
      return submission;
    }

    const reports = (submission as { reports: unknown }).reports;
    if (!Array.isArray(reports)) return submission;

    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        if (!report || typeof report !== "object" || !("evaluationData" in report)) return report;

        const evaluationData = (report as { evaluationData: unknown }).evaluationData;
        if (!this.isSpeakingEvaluationResult(evaluationData)) return report;

        return { ...report, evaluationData: await this.speakingFeedbackService.enrich(evaluationData) };
      })
    );

    return { ...submission, reports: enrichedReports };
  }

  private isSpeakingEvaluationResult(value: unknown): value is SpeakingEvaluationResult {
    return (
      !!value &&
      typeof value === "object" &&
      "transcript" in value &&
      "overallBand" in value &&
      "algorithmVersion" in value
    );
  }
}
