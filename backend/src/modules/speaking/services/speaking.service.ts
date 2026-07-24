import { evaluateSpeaking } from "../algorithm/speakingAlgorithm";
import type {
  GrammarAnalysis,
  PronunciationAnalysis,
  QuestionMetadata,
  SpeakingEvaluationResult,
} from "../algorithm/types";
import {
  HttpGrammarProvider,
  UnconfiguredGrammarProvider,
  type GrammarProvider,
} from "../providers/grammar.provider";
import {
  HttpPronunciationProvider,
  UnconfiguredPronunciationProvider,
  type PronunciationProvider,
} from "../providers/pronunciation.provider";
import {
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
}

interface ProcessedRecording {
  recordingId: string;
  partNumber: 1 | 2 | 3;
  durationSeconds: number;
  transcript: string;
  grammar: GrammarAnalysis;
  pronunciation: PronunciationAnalysis;
  speechToTextConfidence?: number;
}

interface ProcessedPart {
  report: SpeakingEvaluationResult;
  recordings: ProcessedRecording[];
  grammar: GrammarAnalysis;
  pronunciation: PronunciationAnalysis;
  durationSeconds: number;
  questionMetadata: QuestionMetadata;
}

export class SpeakingServiceError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = "SpeakingServiceError";
  }
}

/** Builds generic provider adapters from optional deployment configuration. */
export function createSpeakingProvidersFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env
): SpeakingProviders {
  const speechToTextDelegate = environment.SPEAKING_STT_ENDPOINT
    ? new HttpSpeechToTextProvider({
        endpoint: environment.SPEAKING_STT_ENDPOINT,
        apiKey: environment.SPEAKING_STT_API_KEY,
      })
    : undefined;
  return {
    speechToText: new TranscriptFallbackSpeechToTextProvider(speechToTextDelegate),
    grammar: environment.SPEAKING_GRAMMAR_ENDPOINT
      ? new HttpGrammarProvider({
          endpoint: environment.SPEAKING_GRAMMAR_ENDPOINT,
          apiKey: environment.SPEAKING_GRAMMAR_API_KEY,
        })
      : new UnconfiguredGrammarProvider(),
    pronunciation: environment.SPEAKING_PRONUNCIATION_ENDPOINT
      ? new HttpPronunciationProvider({
          endpoint: environment.SPEAKING_PRONUNCIATION_ENDPOINT,
          apiKey: environment.SPEAKING_PRONUNCIATION_API_KEY,
        })
      : new UnconfiguredPronunciationProvider(),
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

function combineQuestionMetadata(part: {
  questionMetadata: QuestionMetadata;
  recordings: Array<{ questionMetadata: QuestionMetadata }>;
}): QuestionMetadata {
  const recordingMetadata = part.recordings.map((recording) => recording.questionMetadata);
  const questionIds = [...new Set(recordingMetadata.flatMap((metadata) => metadata.questionIds ?? []))];
  const firstTopic = recordingMetadata.map((metadata) => metadata.topic).find((topic): topic is string => Boolean(topic));
  const firstPrompt = recordingMetadata.map((metadata) => metadata.prompt).find((prompt): prompt is string => Boolean(prompt));
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
    ...(part.questionMetadata.prompt || !firstPrompt ? {} : { prompt: firstPrompt }),
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
    private readonly providers: SpeakingProviders = createSpeakingProvidersFromEnvironment()
  ) {}

  async submit(userId: string, input: CreateSpeakingSubmissionInput) {
    const submission = await this.repository.startSubmission(userId, input);
    const recordingIdByResponse = new Map(
      submission.recordings.map((recording) => [`${recording.partNumber}:${recording.responseKey}`, recording.id])
    );

    try {
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

              const [grammar, pronunciation] = await Promise.all([
                this.providers.grammar.analyze({ transcript, language: "en", correlationId: submission.id }),
                this.providers.pronunciation.analyze({ audio, transcript, language: "en", correlationId: submission.id }),
              ]);

              return {
                recordingId,
                partNumber: part.partNumber,
                durationSeconds: recording.durationSeconds,
                transcript,
                grammar,
                pronunciation,
                ...(transcription.confidence === undefined ? {} : { speechToTextConfidence: transcription.confidence }),
              };
            })
          );
          const grammar = aggregateGrammar(recordings);
          const pronunciation = aggregatePronunciation(recordings);
          const durationSeconds = recordings.reduce((total, recording) => total + recording.durationSeconds, 0);
          const questionMetadata = combineQuestionMetadata(part);
          return {
            report: evaluateSpeaking({
              transcript: recordings.map((recording) => recording.transcript).join("\n"),
              durationSeconds,
              grammarAnalysis: grammar,
              pronunciationAnalysis: pronunciation,
              partNumber: part.partNumber,
              questionMetadata,
            }),
            recordings,
            grammar,
            pronunciation,
            durationSeconds,
            questionMetadata,
          };
        })
      );

      const mockReport =
        input.mode === "mock"
          ? evaluateSpeaking({
              transcript: parts.map((part) => part.report.transcript).join("\n"),
              durationSeconds: parts.reduce((total, part) => total + part.durationSeconds, 0),
              grammarAnalysis: aggregateGrammar(parts.flatMap((part) => part.recordings)),
              pronunciationAnalysis: aggregatePronunciation(parts.flatMap((part) => part.recordings)),
              partNumber: "mock",
              questionMetadata: { questionCount: parts.reduce((total, part) => total + (part.questionMetadata.questionCount ?? 0), 0) },
            })
          : undefined;

      return await this.repository.completeSubmission(submission.id, {
        recordingEvaluations: parts.flatMap((part) => part.recordings.map(toProviderPersistence)),
        partReports: parts.map((part) => part.report),
        ...(mockReport ? { mockReport } : {}),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Speaking evaluation failed.";
      await this.repository.markFailed(submission.id, message);
      if (error instanceof SpeakingServiceError) throw error;
      if (error instanceof SpeakingProviderError) throw new SpeakingServiceError(error.message, error.statusCode);
      throw new SpeakingServiceError("Speaking evaluation failed.", 502);
    }
  }

  async getSubmission(userId: string, submissionId: string) {
    const submission = await this.repository.findSubmissionForUser(userId, submissionId);
    if (!submission) throw new SpeakingServiceError("Speaking submission not found.", 404);
    return submission;
  }
}
