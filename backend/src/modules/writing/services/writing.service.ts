import { calculateCefrLevel, calculateMockOverallBand } from "../algorithm/bandCalculator";
import { evaluateWriting } from "../algorithm/writingAlgorithm";
import type {
  RepeatedWord,
  WritingEvaluationResult,
  WritingMockReport,
  WritingProviderUsed,
} from "../algorithm/types";
import { GeminiWritingProvider } from "../providers/gemini-writing.provider";
import { LocalEssayAnalysisProvider } from "../providers/local-essay.provider";
import { LocalGrammarProvider } from "../providers/local-grammar.provider";
import {
  WritingProviderError,
  type EssayAnalysisProvider,
  type GrammarProvider,
  type WritingAnalysisProvider,
} from "../providers/provider.interface";
import {
  WritingEvaluationRepository,
  type WritingEvaluationRepositoryPort,
  type WritingTaskProviderData,
} from "../repository/writing.repository";
import type { CreateWritingSubmissionInput } from "../writing.schemas";

export interface WritingProviders {
  gemini?: WritingAnalysisProvider;
  grammar: GrammarProvider;
  essayAnalysis: EssayAnalysisProvider;
}

export class WritingServiceError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = "WritingServiceError";
  }
}

export function createWritingProvidersFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env
): WritingProviders {
  return {
    ...(environment.GEMINI_API_KEY
      ? { gemini: new GeminiWritingProvider({ apiKey: environment.GEMINI_API_KEY }) }
      : {}),
    grammar: new LocalGrammarProvider(),
    essayAnalysis: new LocalEssayAnalysisProvider(),
  };
}

function average(values: readonly number[]): number {
  return values.length === 0 ? 0 : Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(2));
}

function combineRepeatedWords(reports: readonly WritingEvaluationResult[]): RepeatedWord[] {
  const counts = new Map<string, number>();
  for (const report of reports) {
    for (const repeated of report.repeatedWords) {
      counts.set(repeated.word, (counts.get(repeated.word) ?? 0) + repeated.count);
    }
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
}

function buildMockReport(taskReports: WritingEvaluationResult[]): WritingMockReport {
  const reports = [...taskReports].sort((left, right) => left.taskNumber - right.taskNumber);
  const strengths = [...new Set(reports.flatMap((report) => report.strengths))];
  const weakAreas = [...new Set(reports.flatMap((report) => report.weakAreas))];
  const recommendations = [...new Set(reports.flatMap((report) => report.recommendations))];
  const overallBand = calculateMockOverallBand(reports);

  return {
    status: reports.length === 2 && reports.every((report) => report.status === "Completed")
      ? "Completed"
      : "Incomplete",
    taskNumber: "mock",
    taskReports: reports,
    wordCount: reports.reduce((total, report) => total + report.wordCount, 0),
    uniqueWords: reports.reduce((total, report) => total + report.uniqueWords, 0),
    repeatedWords: combineRepeatedWords(reports),
    grammarErrors: reports.flatMap((report) => report.grammarErrors),
    spellingErrors: reports.flatMap((report) => report.spellingErrors),
    punctuationErrors: reports.flatMap((report) => report.punctuationErrors),
    taskAchievementScore: average(reports.map((report) => report.taskAchievementScore)),
    coherenceScore: average(reports.map((report) => report.coherenceScore)),
    vocabularyScore: average(reports.map((report) => report.vocabularyScore)),
    grammarScore: average(reports.map((report) => report.grammarScore)),
    overallBand,
    cefrLevel: calculateCefrLevel(overallBand),
    strengths,
    weakAreas,
    recommendations,
    providerUsed: reports.every((report) => report.providerUsed === "Gemini") ? "Gemini" : "Local Fallback",
    evaluationTimeMs: reports.reduce((total, report) => total + report.evaluationTimeMs, 0),
    algorithmVersion: "writing-v1",
  };
}

/** Coordinates external providers; the evaluator itself remains pure. */
export class WritingEvaluationService {
  constructor(
    private readonly repository: WritingEvaluationRepositoryPort = new WritingEvaluationRepository(),
    private readonly providers: WritingProviders = createWritingProvidersFromEnvironment()
  ) {}

  private async analyzeTask(
    task: CreateWritingSubmissionInput["tasks"][number],
    submissionId: string
  ): Promise<{
    grammarResult: Awaited<ReturnType<GrammarProvider["analyze"]>>;
    essayAnalysis: Awaited<ReturnType<EssayAnalysisProvider["analyze"]>>;
    providerUsed: WritingProviderUsed;
  }> {
    const providerInput = {
      essay: task.essay,
      taskNumber: task.taskNumber,
      questionMetadata: task.questionMetadata,
      correlationId: submissionId,
    };

    if (this.providers.gemini) {
      try {
        const result = await this.providers.gemini.analyze(providerInput);
        return { ...result, providerUsed: "Gemini" };
      } catch {
        // Provider errors (timeouts, transport failures, malformed JSON, and
        // incomplete Gemini responses) intentionally fall through to local analysis.
      }
    }

    const [grammarResult, essayAnalysis] = await Promise.all([
      this.providers.grammar.analyze(providerInput),
      this.providers.essayAnalysis.analyze(providerInput),
    ]);
    return { grammarResult, essayAnalysis, providerUsed: "Local Fallback" };
  }

  async submit(userId: string, input: CreateWritingSubmissionInput) {
    const submission = await this.repository.startSubmission(userId, input);
    // Presence in the request does not mean the learner attempted the task.
    // A mock is complete only when both Task 1 and Task 2 contain an essay.
    const completedTaskNumbers = input.tasks
      .filter((task) => task.essay.trim().length > 0)
      .map((task) => task.taskNumber);

    try {
      const taskEvaluations = await Promise.all(
        input.tasks.map(async (task): Promise<WritingTaskProviderData> => {
          const startedAt = Date.now();
          const { grammarResult, essayAnalysis, providerUsed } = await this.analyzeTask(task, submission.id);
          const evaluationTimeMs = Date.now() - startedAt;
          const report = evaluateWriting({
            essay: task.essay,
            taskNumber: task.taskNumber,
            grammarResult,
            essayAnalysis,
            questionMetadata: task.questionMetadata,
            completedTaskNumbers,
            providerUsed,
            evaluationTimeMs,
            evaluatedAt: new Date().toISOString(),
          });
          return {
            ...(task.taskId ? { taskId: task.taskId } : {}),
            taskNumber: task.taskNumber,
            essay: task.essay,
            grammarResult,
            essayAnalysis,
            providerUsed,
            evaluationTimeMs,
            report,
          };
        })
      );
      const mockReport = input.mode === "mock" ? buildMockReport(taskEvaluations.map((item) => item.report)) : undefined;
      return await this.repository.completeSubmission(submission.id, { taskEvaluations, ...(mockReport ? { mockReport } : {}) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Writing evaluation failed.";
      await this.repository.markFailed(submission.id, message);
      if (error instanceof WritingServiceError) throw error;
      if (error instanceof WritingProviderError) throw new WritingServiceError(error.message, error.statusCode);
      throw new WritingServiceError("Writing evaluation failed.", 502);
    }
  }

  async getSubmission(userId: string, submissionId: string) {
    const submission = await this.repository.findSubmissionForUser(userId, submissionId);
    if (!submission) throw new WritingServiceError("Writing submission not found.", 404);
    return submission;
  }
}
