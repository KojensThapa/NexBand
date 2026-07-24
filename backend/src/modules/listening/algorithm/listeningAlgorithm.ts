/**
 * Pure IELTS Listening evaluation rules.
 *
 * This module deliberately has no dependency on the HTTP layer, Prisma, or a
 * database model. A service can map persisted questions to
 * `ListeningEvaluationQuestion` and call `evaluateListeningTest` directly.
 */

export const LISTENING_QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "FORM_COMPLETION",
  "NOTE_COMPLETION",
  "TABLE_COMPLETION",
  "SUMMARY_COMPLETION",
  "SENTENCE_COMPLETION",
  "MATCHING",
  "MAP_LABELLING",
  "SHORT_ANSWER",
] as const;

export type ListeningQuestionType = (typeof LISTENING_QUESTION_TYPES)[number];
export type ListeningPart = 1 | 2 | 3 | 4;
export type EvaluationStatus = "Completed" | "Incomplete";
export type PerformanceStatus = "Attempted" | "Not Attempted";

export interface ListeningEvaluationQuestion {
  /** A stable question id, normally the persisted question id. */
  id: string;
  /** IELTS Listening part number. */
  part: ListeningPart;
  type: ListeningQuestionType;
  /**
   * One or more accepted answers. Supplying alternatives now avoids a later
   * schema change when a content team adds valid answer variants.
   */
  correctAnswers: readonly string[];
}

export interface ListeningEvaluationInput {
  questions: readonly ListeningEvaluationQuestion[];
  /** Question id to submitted answer. Missing, null, or blank values are skipped. */
  answers: Readonly<Record<string, string | null | undefined>>;
}

export interface PartPerformance {
  part: ListeningPart;
  attempted: number;
  skipped: number;
  correct: number;
  wrong: number;
  /** A percentage from 0 to 100, or null when no question was attempted. */
  accuracy: number | null;
  status: PerformanceStatus;
}

export interface QuestionTypePerformance {
  type: ListeningQuestionType;
  label: string;
  total: number;
  attempted: number;
  correct: number;
  /** A percentage from 0 to 100, or null when no question was attempted. */
  accuracy: number | null;
  status: PerformanceStatus;
}

export interface ListeningEvaluationResult {
  status: EvaluationStatus;
  totalQuestions: number;
  attemptedQuestions: number;
  skippedQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  /** Correct answers divided by attempted questions, expressed as a percentage. */
  attemptAccuracy: number | null;
  overallBand: number | null;
  estimatedBand: number | null;
  partPerformance: PartPerformance[];
  questionTypePerformance: QuestionTypePerformance[];
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
}

interface QuestionEvaluation {
  question: ListeningEvaluationQuestion;
  attempted: boolean;
  correct: boolean;
}

interface Statistics {
  totalQuestions: number;
  attemptedQuestions: number;
  skippedQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  attemptAccuracy: number | null;
}

const QUESTION_TYPE_LABELS: Record<ListeningQuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  FORM_COMPLETION: "Form Completion",
  NOTE_COMPLETION: "Note Completion",
  TABLE_COMPLETION: "Table Completion",
  SUMMARY_COMPLETION: "Summary Completion",
  SENTENCE_COMPLETION: "Sentence Completion",
  MATCHING: "Matching",
  MAP_LABELLING: "Map / Plan / Diagram Labelling",
  SHORT_ANSWER: "Short Answer",
};

const LISTENING_PARTS: readonly ListeningPart[] = [1, 2, 3, 4];

/**
 * Makes text comparison case-insensitive and resilient to ordinary input
 * punctuation. Keep comparison behind `isExactMatch` so a fuzzy matching
 * policy can later be introduced without changing question evaluators.
 */
export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isAttempted(answer: string | null | undefined): answer is string {
  return typeof answer === "string" && normalizeAnswer(answer).length > 0;
}

function isExactMatch(answer: string, correctAnswers: readonly string[]): boolean {
  const normalizedAnswer = normalizeAnswer(answer);

  return correctAnswers.some(
    (correctAnswer) => normalizedAnswer === normalizeAnswer(correctAnswer)
  );
}

type QuestionEvaluator = (
  answer: string,
  correctAnswers: readonly string[]
) => boolean;

function evaluateMultipleChoice(answer: string, correctAnswers: readonly string[]): boolean {
  return isExactMatch(answer, correctAnswers);
}

function evaluateFormCompletion(answer: string, correctAnswers: readonly string[]): boolean {
  return isExactMatch(answer, correctAnswers);
}

function evaluateNoteCompletion(answer: string, correctAnswers: readonly string[]): boolean {
  return isExactMatch(answer, correctAnswers);
}

function evaluateTableCompletion(answer: string, correctAnswers: readonly string[]): boolean {
  return isExactMatch(answer, correctAnswers);
}

function evaluateSummaryCompletion(answer: string, correctAnswers: readonly string[]): boolean {
  return isExactMatch(answer, correctAnswers);
}

function evaluateSentenceCompletion(answer: string, correctAnswers: readonly string[]): boolean {
  return isExactMatch(answer, correctAnswers);
}

function evaluateMatching(answer: string, correctAnswers: readonly string[]): boolean {
  return isExactMatch(answer, correctAnswers);
}

function evaluateMapDiagram(answer: string, correctAnswers: readonly string[]): boolean {
  return isExactMatch(answer, correctAnswers);
}

function evaluateShortAnswer(answer: string, correctAnswers: readonly string[]): boolean {
  return isExactMatch(answer, correctAnswers);
}

const QUESTION_EVALUATORS: Record<ListeningQuestionType, QuestionEvaluator> = {
  MULTIPLE_CHOICE: evaluateMultipleChoice,
  FORM_COMPLETION: evaluateFormCompletion,
  NOTE_COMPLETION: evaluateNoteCompletion,
  TABLE_COMPLETION: evaluateTableCompletion,
  SUMMARY_COMPLETION: evaluateSummaryCompletion,
  SENTENCE_COMPLETION: evaluateSentenceCompletion,
  MATCHING: evaluateMatching,
  MAP_LABELLING: evaluateMapDiagram,
  SHORT_ANSWER: evaluateShortAnswer,
};

function evaluateQuestion(
  question: ListeningEvaluationQuestion,
  submittedAnswer: string | null | undefined
): QuestionEvaluation {
  if (!isAttempted(submittedAnswer)) {
    return { question, attempted: false, correct: false };
  }

  return {
    question,
    attempted: true,
    correct: QUESTION_EVALUATORS[question.type](submittedAnswer, question.correctAnswers),
  };
}

function toPercentage(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;

  return Number(((numerator / denominator) * 100).toFixed(2));
}

function calculateStatistics(evaluations: readonly QuestionEvaluation[]): Statistics {
  const attemptedQuestions = evaluations.filter((evaluation) => evaluation.attempted).length;
  const correctAnswers = evaluations.filter((evaluation) => evaluation.correct).length;

  return {
    totalQuestions: evaluations.length,
    attemptedQuestions,
    skippedQuestions: evaluations.length - attemptedQuestions,
    correctAnswers,
    wrongAnswers: attemptedQuestions - correctAnswers,
    attemptAccuracy: toPercentage(correctAnswers, attemptedQuestions),
  };
}

function calculatePartPerformance(
  evaluations: readonly QuestionEvaluation[]
): PartPerformance[] {
  return LISTENING_PARTS.map((part) => {
    const partEvaluations = evaluations.filter((evaluation) => evaluation.question.part === part);
    const attempted = partEvaluations.filter((evaluation) => evaluation.attempted).length;
    const correct = partEvaluations.filter((evaluation) => evaluation.correct).length;

    return {
      part,
      attempted,
      skipped: partEvaluations.length - attempted,
      correct,
      wrong: attempted - correct,
      accuracy: toPercentage(correct, attempted),
      status: attempted === 0 ? "Not Attempted" : "Attempted",
    };
  });
}

function calculateQuestionTypePerformance(
  evaluations: readonly QuestionEvaluation[]
): QuestionTypePerformance[] {
  return LISTENING_QUESTION_TYPES.flatMap((type) => {
    const typeEvaluations = evaluations.filter((evaluation) => evaluation.question.type === type);
    if (typeEvaluations.length === 0) return [];

    const attempted = typeEvaluations.filter((evaluation) => evaluation.attempted).length;
    const correct = typeEvaluations.filter((evaluation) => evaluation.correct).length;

    return [{
      type,
      label: QUESTION_TYPE_LABELS[type],
      total: typeEvaluations.length,
      attempted,
      correct,
      accuracy: toPercentage(correct, attempted),
      status: attempted === 0 ? "Not Attempted" : "Attempted",
    }];
  });
}

/** Official IELTS Listening raw-score to band-score conversion. */
export function calculateBand(correctAnswers: number): number {
  const score = Math.max(0, Math.min(40, Math.floor(correctAnswers)));

  if (score >= 39) return 9;
  if (score >= 37) return 8.5;
  if (score >= 35) return 8;
  if (score >= 32) return 7.5;
  if (score >= 30) return 7;
  if (score >= 26) return 6.5;
  if (score >= 23) return 6;
  if (score >= 18) return 5.5;
  if (score >= 16) return 5;
  if (score >= 13) return 4.5;
  if (score >= 11) return 4;
  if (score >= 8) return 3.5;
  if (score >= 6) return 3;
  if (score >= 4) return 2.5;
  if (score >= 3) return 2;
  if (score >= 2) return 1.5;
  if (score >= 1) return 1;
  return 0;
}

function findQuestionTypePerformance(
  performance: readonly QuestionTypePerformance[],
  type: ListeningQuestionType
): QuestionTypePerformance | undefined {
  return performance.find((item) => item.type === type);
}

function isStrong(performance: QuestionTypePerformance | PartPerformance | undefined): boolean {
  return performance !== undefined && performance.accuracy !== null && performance.accuracy >= 80;
}

function generateStrengths(
  partPerformance: readonly PartPerformance[],
  questionTypePerformance: readonly QuestionTypePerformance[]
): string[] {
  const strengths: string[] = [];
  const partOne = partPerformance.find((performance) => performance.part === 1);
  const partFour = partPerformance.find((performance) => performance.part === 4);

  if (isStrong(partOne)) strengths.push("Strong performance in everyday conversations.");
  if (isStrong(partFour)) strengths.push("Excellent understanding of academic lectures.");
  if (isStrong(findQuestionTypePerformance(questionTypePerformance, "FORM_COMPLETION"))) {
    strengths.push("Strong note-taking skills.");
  }
  if (isStrong(findQuestionTypePerformance(questionTypePerformance, "MULTIPLE_CHOICE"))) {
    strengths.push("Good understanding of spoken details.");
  }

  return strengths;
}

function weakAreaFor(type: ListeningQuestionType, label: string): string {
  switch (type) {
    case "MAP_LABELLING":
      return "Difficulty following directions.";
    case "MULTIPLE_CHOICE":
      return "Difficulty recognising distractors.";
    case "SENTENCE_COMPLETION":
      return "Need better keyword listening.";
    case "FORM_COMPLETION":
      return "Need to improve spelling and note-taking.";
    default:
      return `Weak in ${label}.`;
  }
}

function generateWeakAreas(
  questionTypePerformance: readonly QuestionTypePerformance[]
): string[] {
  return questionTypePerformance
    .filter((performance) => performance.accuracy !== null && performance.accuracy < 60)
    .map((performance) => weakAreaFor(performance.type, performance.label));
}

function recommendationFor(type: ListeningQuestionType): string {
  switch (type) {
    case "MAP_LABELLING":
      return "Practice listening for directions and locations.";
    case "MULTIPLE_CHOICE":
      return "Practice recognising distractors in conversations.";
    case "SENTENCE_COMPLETION":
      return "Practice identifying keywords while listening.";
    case "FORM_COMPLETION":
      return "Improve spelling and note-taking.";
    case "NOTE_COMPLETION":
      return "Practice listening for key details and writing concise notes.";
    case "TABLE_COMPLETION":
      return "Practice tracking categories, names, and numerical information.";
    case "SUMMARY_COMPLETION":
      return "Practice following the overall meaning and its key terms.";
    case "MATCHING":
      return "Practice tracking speakers, options, and relationships.";
    case "SHORT_ANSWER":
      return "Practice spelling and keyword scanning.";
  }
}

function generateRecommendations(
  questionTypePerformance: readonly QuestionTypePerformance[]
): string[] {
  return questionTypePerformance
    .filter((performance) => performance.accuracy !== null && performance.accuracy < 60)
    .map((performance) => recommendationFor(performance.type));
}

/**
 * Evaluates a complete or early-submitted IELTS Listening test. Its result is
 * deterministic and serialisable, making it suitable for a report service or
 * direct unit testing.
 */
export function evaluateListeningTest(
  input: ListeningEvaluationInput
): ListeningEvaluationResult {
  const evaluations = input.questions.map((question) =>
    evaluateQuestion(question, input.answers[question.id])
  );
  const statistics = calculateStatistics(evaluations);
  const partPerformance = calculatePartPerformance(evaluations);
  const questionTypePerformance = calculateQuestionTypePerformance(evaluations);
  const status: EvaluationStatus =
    statistics.attemptedQuestions === statistics.totalQuestions ? "Completed" : "Incomplete";
  const band = calculateBand(statistics.correctAnswers);
  const strengths = generateStrengths(partPerformance, questionTypePerformance);
  const weakAreas = generateWeakAreas(questionTypePerformance);

  return {
    status,
    ...statistics,
    overallBand: status === "Completed" ? band : null,
    estimatedBand: status === "Incomplete" ? band : null,
    partPerformance,
    questionTypePerformance,
    strengths,
    weakAreas,
    recommendations: generateRecommendations(questionTypePerformance),
  };
}

// ---------------------------------------------------------------------------
// Backward-compatible score helper used by the existing submission service.
// New code should map questions to ListeningEvaluationQuestion and use
// evaluateListeningTest so it can produce the full evaluation report.
// ---------------------------------------------------------------------------

type ScoreableListeningQuestion = {
  id: string;
  correctAnswer: string;
  marks: number;
};

export type BasicListeningScore = {
  correctAnswers: number;
  totalQuestions: number;
  rawScore: number;
  totalMarks: number;
  percentage: number;
  bandScore: number;
  algorithmVersion: "basic-v1";
};

export function calculateBasicListeningScore(
  questions: readonly ScoreableListeningQuestion[],
  answers: Readonly<Record<string, string | null | undefined>>
): BasicListeningScore {
  let correctAnswers = 0;
  let rawScore = 0;
  const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);

  for (const question of questions) {
    const submittedAnswer = answers[question.id];
    if (!isAttempted(submittedAnswer)) continue;

    if (isExactMatch(submittedAnswer, [question.correctAnswer])) {
      correctAnswers += 1;
      rawScore += question.marks;
    }
  }

  const percentage = totalMarks === 0 ? 0 : (rawScore / totalMarks) * 100;
  const bandScore = Number((Math.round((percentage / 100) * 9 * 2) / 2).toFixed(1));

  return {
    correctAnswers,
    totalQuestions: questions.length,
    rawScore,
    totalMarks,
    percentage: Number(percentage.toFixed(2)),
    bandScore,
    algorithmVersion: "basic-v1",
  };
}
