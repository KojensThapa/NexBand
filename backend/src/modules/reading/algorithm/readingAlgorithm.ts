/**
 * Framework-independent IELTS Reading evaluation rules.
 *
 * The caller is responsible for mapping persisted questions to
 * `ReadingEvaluationQuestion`. This module deliberately has no Fastify,
 * Prisma, or database dependency.
 */

export const READING_QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE_NOT_GIVEN",
  "YES_NO_NOT_GIVEN",
  "MATCHING_HEADING",
  "MATCHING_INFORMATION",
  "MATCHING_FEATURES",
  "MATCHING_SENTENCE_ENDINGS",
  "SENTENCE_COMPLETION",
  "SUMMARY_COMPLETION",
  "NOTE_COMPLETION",
  "TABLE_COMPLETION",
  "FLOW_CHART_COMPLETION",
  "DIAGRAM_LABELLING",
  "SHORT_ANSWER",
] as const;

export type ReadingQuestionType = (typeof READING_QUESTION_TYPES)[number];
export type ReadingSection = 1 | 2 | 3;
export type IELTSReadingModule = "ACADEMIC" | "GENERAL_TRAINING";
export type EvaluationStatus = "Completed" | "Incomplete";
export type AttemptStatus = "Attempted" | "Not Attempted";

export type AnswerMapping = Readonly<Record<string, string>>;
export type ReadingAnswer = string | AnswerMapping;

/**
 * A normal question uses `correctAnswer` for one or more accepted answers.
 * A grouped matching question can additionally use `correctMappings`, where
 * each key is a prompt/blank identifier and each value is its correct match.
 */
export interface ReadingEvaluationQuestion {
  id: string;
  section: ReadingSection;
  type: ReadingQuestionType;
  correctAnswer: readonly string[];
  correctMappings?: AnswerMapping;
}

export interface ReadingEvaluationInput {
  questions: readonly ReadingEvaluationQuestion[];
  answers: Readonly<Record<string, ReadingAnswer | undefined>>;
  /** Defaults to Academic Reading, which is the standard reading conversion table. */
  module?: IELTSReadingModule;
}

export interface SectionPerformance {
  section: ReadingSection;
  attempted: number;
  skipped: number;
  correct: number;
  wrong: number;
  accuracy: number | null;
  status: AttemptStatus;
}

export interface QuestionTypePerformance {
  type: ReadingQuestionType;
  label: string;
  total: number;
  attempted: number;
  correct: number;
  accuracy: number | null;
  status: AttemptStatus;
}

export interface ReadingEvaluationResult {
  status: EvaluationStatus;
  totalQuestions: number;
  attemptedQuestions: number;
  skippedQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  /** Correct answers divided by attempted questions, never total questions. */
  attemptAccuracy: number | null;
  overallBand: number | null;
  estimatedBand: number | null;
  sectionPerformance: SectionPerformance[];
  questionTypePerformance: QuestionTypePerformance[];
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
}

type EvaluatedQuestion = {
  question: ReadingEvaluationQuestion;
  attempted: boolean;
  correct: boolean;
};

type Statistics = Pick<
  ReadingEvaluationResult,
  | "totalQuestions"
  | "attemptedQuestions"
  | "skippedQuestions"
  | "correctAnswers"
  | "wrongAnswers"
  | "attemptAccuracy"
>;

const QUESTION_TYPE_LABELS: Record<ReadingQuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE_NOT_GIVEN: "True / False / Not Given",
  YES_NO_NOT_GIVEN: "Yes / No / Not Given",
  MATCHING_HEADING: "Matching Headings",
  MATCHING_INFORMATION: "Matching Information",
  MATCHING_FEATURES: "Matching Features",
  MATCHING_SENTENCE_ENDINGS: "Matching Sentence Endings",
  SENTENCE_COMPLETION: "Sentence Completion",
  SUMMARY_COMPLETION: "Summary Completion",
  NOTE_COMPLETION: "Note Completion",
  TABLE_COMPLETION: "Table Completion",
  FLOW_CHART_COMPLETION: "Flow Chart Completion",
  DIAGRAM_LABELLING: "Diagram Labelling",
  SHORT_ANSWER: "Short Answer",
};

const ACADEMIC_BAND_TABLE: ReadonlyArray<readonly [minimumCorrect: number, band: number]> = [
  [39, 9],
  [37, 8.5],
  [35, 8],
  [33, 7.5],
  [30, 7],
  [27, 6.5],
  [23, 6],
  [19, 5.5],
  [15, 5],
  [13, 4.5],
  [10, 4],
  [8, 3.5],
  [6, 3],
  [4, 2.5],
  [3, 2],
  [2, 1.5],
  [1, 1],
  [0, 0],
];

const GENERAL_TRAINING_BAND_TABLE: ReadonlyArray<
  readonly [minimumCorrect: number, band: number]
> = [
  [40, 9],
  [39, 8.5],
  [37, 8],
  [36, 7.5],
  [34, 7],
  [32, 6.5],
  [30, 6],
  [27, 5.5],
  [23, 5],
  [19, 4.5],
  [15, 4],
  [12, 3.5],
  [9, 3],
  [6, 2.5],
  [4, 2],
  [2, 1.5],
  [1, 1],
  [0, 0],
];

/**
 * Removes formatting differences that should not make an otherwise correct
 * text answer wrong. Fuzzy matching can later replace `isExactMatch` without
 * changing any question evaluator.
 */
export function normalizeAnswer(answer: string): string {
  return answer
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isExactMatch(submitted: string, expected: string): boolean {
  return normalizeAnswer(submitted) === normalizeAnswer(expected);
}

function isAnswerMapping(answer: ReadingAnswer | undefined): answer is AnswerMapping {
  return typeof answer === "object" && answer !== null && !Array.isArray(answer);
}

function isAttempted(answer: ReadingAnswer | undefined): boolean {
  if (typeof answer === "string") {
    return normalizeAnswer(answer).length > 0;
  }

  return isAnswerMapping(answer)
    ? Object.values(answer).some((value) => normalizeAnswer(value).length > 0)
    : false;
}

function evaluateExactAnswer(
  answer: ReadingAnswer | undefined,
  acceptedAnswers: readonly string[]
): boolean {
  if (typeof answer !== "string") return false;
  return acceptedAnswers.some((expected) => isExactMatch(answer, expected));
}

function evaluateMultipleChoice(answer: ReadingAnswer | undefined, question: ReadingEvaluationQuestion) {
  return evaluateExactAnswer(answer, question.correctAnswer);
}

function evaluateTrueFalseNotGiven(
  answer: ReadingAnswer | undefined,
  question: ReadingEvaluationQuestion
) {
  return evaluateExactAnswer(answer, question.correctAnswer);
}

function evaluateYesNoNotGiven(
  answer: ReadingAnswer | undefined,
  question: ReadingEvaluationQuestion
) {
  return evaluateExactAnswer(answer, question.correctAnswer);
}

function evaluateMatching(answer: ReadingAnswer | undefined, question: ReadingEvaluationQuestion) {
  if (!question.correctMappings) {
    return evaluateExactAnswer(answer, question.correctAnswer);
  }

  if (!isAnswerMapping(answer)) return false;

  return Object.entries(question.correctMappings).every(([mappingId, correctMatch]) => {
    const submittedMatch = answer[mappingId];
    return typeof submittedMatch === "string" && isExactMatch(submittedMatch, correctMatch);
  });
}

function evaluateMatchingHeading(answer: ReadingAnswer | undefined, question: ReadingEvaluationQuestion) {
  return evaluateMatching(answer, question);
}

function evaluateMatchingInformation(answer: ReadingAnswer | undefined, question: ReadingEvaluationQuestion) {
  return evaluateMatching(answer, question);
}

function evaluateMatchingFeatures(answer: ReadingAnswer | undefined, question: ReadingEvaluationQuestion) {
  return evaluateMatching(answer, question);
}

function evaluateMatchingSentenceEndings(
  answer: ReadingAnswer | undefined,
  question: ReadingEvaluationQuestion
) {
  return evaluateMatching(answer, question);
}

function evaluateSentenceCompletion(
  answer: ReadingAnswer | undefined,
  question: ReadingEvaluationQuestion
) {
  return evaluateExactAnswer(answer, question.correctAnswer);
}

function evaluateSummaryCompletion(
  answer: ReadingAnswer | undefined,
  question: ReadingEvaluationQuestion
) {
  return evaluateExactAnswer(answer, question.correctAnswer);
}

function evaluateNoteCompletion(answer: ReadingAnswer | undefined, question: ReadingEvaluationQuestion) {
  return evaluateExactAnswer(answer, question.correctAnswer);
}

function evaluateTableCompletion(answer: ReadingAnswer | undefined, question: ReadingEvaluationQuestion) {
  return evaluateExactAnswer(answer, question.correctAnswer);
}

function evaluateFlowChartCompletion(
  answer: ReadingAnswer | undefined,
  question: ReadingEvaluationQuestion
) {
  return evaluateExactAnswer(answer, question.correctAnswer);
}

function evaluateDiagramLabelling(
  answer: ReadingAnswer | undefined,
  question: ReadingEvaluationQuestion
) {
  return evaluateExactAnswer(answer, question.correctAnswer);
}

function evaluateShortAnswer(answer: ReadingAnswer | undefined, question: ReadingEvaluationQuestion) {
  return evaluateExactAnswer(answer, question.correctAnswer);
}

function evaluateQuestion(question: ReadingEvaluationQuestion, answer: ReadingAnswer | undefined) {
  const evaluators: Record<
    ReadingQuestionType,
    (submitted: ReadingAnswer | undefined, item: ReadingEvaluationQuestion) => boolean
  > = {
    MULTIPLE_CHOICE: evaluateMultipleChoice,
    TRUE_FALSE_NOT_GIVEN: evaluateTrueFalseNotGiven,
    YES_NO_NOT_GIVEN: evaluateYesNoNotGiven,
    MATCHING_HEADING: evaluateMatchingHeading,
    MATCHING_INFORMATION: evaluateMatchingInformation,
    MATCHING_FEATURES: evaluateMatchingFeatures,
    MATCHING_SENTENCE_ENDINGS: evaluateMatchingSentenceEndings,
    SENTENCE_COMPLETION: evaluateSentenceCompletion,
    SUMMARY_COMPLETION: evaluateSummaryCompletion,
    NOTE_COMPLETION: evaluateNoteCompletion,
    TABLE_COMPLETION: evaluateTableCompletion,
    FLOW_CHART_COMPLETION: evaluateFlowChartCompletion,
    DIAGRAM_LABELLING: evaluateDiagramLabelling,
    SHORT_ANSWER: evaluateShortAnswer,
  };

  const attempted = isAttempted(answer);
  return {
    question,
    attempted,
    correct: attempted && evaluators[question.type](answer, question),
  } satisfies EvaluatedQuestion;
}

function toPercentage(correct: number, attempted: number): number | null {
  if (attempted === 0) return null;
  return Number(((correct / attempted) * 100).toFixed(2));
}

function calculateStatistics(evaluatedQuestions: readonly EvaluatedQuestion[]): Statistics {
  const totalQuestions = evaluatedQuestions.length;
  const attemptedQuestions = evaluatedQuestions.filter((item) => item.attempted).length;
  const correctAnswers = evaluatedQuestions.filter((item) => item.correct).length;

  return {
    totalQuestions,
    attemptedQuestions,
    skippedQuestions: totalQuestions - attemptedQuestions,
    correctAnswers,
    wrongAnswers: attemptedQuestions - correctAnswers,
    attemptAccuracy: toPercentage(correctAnswers, attemptedQuestions),
  };
}

function calculateSectionPerformance(
  evaluatedQuestions: readonly EvaluatedQuestion[]
): SectionPerformance[] {
  return ([1, 2, 3] as const).map((section) => {
    const questions = evaluatedQuestions.filter((item) => item.question.section === section);
    const attempted = questions.filter((item) => item.attempted).length;
    const correct = questions.filter((item) => item.correct).length;

    return {
      section,
      attempted,
      skipped: questions.length - attempted,
      correct,
      wrong: attempted - correct,
      accuracy: toPercentage(correct, attempted),
      status: attempted === 0 ? "Not Attempted" : "Attempted",
    };
  });
}

function calculateQuestionTypePerformance(
  evaluatedQuestions: readonly EvaluatedQuestion[]
): QuestionTypePerformance[] {
  const includedTypes = new Set(evaluatedQuestions.map((item) => item.question.type));

  return READING_QUESTION_TYPES.filter((type) => includedTypes.has(type)).map((type) => {
    const questions = evaluatedQuestions.filter((item) => item.question.type === type);
    const attempted = questions.filter((item) => item.attempted).length;
    const correct = questions.filter((item) => item.correct).length;

    return {
      type,
      label: QUESTION_TYPE_LABELS[type],
      total: questions.length,
      attempted,
      correct,
      accuracy: toPercentage(correct, attempted),
      status: attempted === 0 ? "Not Attempted" : "Attempted",
    };
  });
}

/**
 * Converts a raw score out of 40 using the official IELTS Reading tables.
 * Academic Reading is used by default; callers may opt into General Training.
 */
export function calculateBand(
  correctAnswers: number,
  module: IELTSReadingModule = "ACADEMIC"
): number {
  const rawScore = Math.max(0, Math.min(40, Math.floor(correctAnswers)));
  const bandTable = module === "GENERAL_TRAINING" ? GENERAL_TRAINING_BAND_TABLE : ACADEMIC_BAND_TABLE;

  return bandTable.find(([minimumCorrect]) => rawScore >= minimumCorrect)?.[1] ?? 0;
}

function generateStrengths(
  attemptAccuracy: number | null,
  sectionPerformance: readonly SectionPerformance[],
  questionTypePerformance: readonly QuestionTypePerformance[]
): string[] {
  const strengths = sectionPerformance
    .filter((section) => section.accuracy !== null && section.accuracy >= 80)
    .map((section) => `Good performance in Section ${section.section}`);

  for (const performance of questionTypePerformance) {
    if (performance.accuracy !== null && performance.accuracy >= 80) {
      strengths.push(`Strong ${performance.label} skills`);
    }
  }

  if (attemptAccuracy !== null && attemptAccuracy >= 85) {
    strengths.push("Excellent reading comprehension");
  }

  return strengths;
}

function weakAreaFor(type: ReadingQuestionType, label: string): string {
  switch (type) {
    case "TRUE_FALSE_NOT_GIVEN":
      return "Difficulty distinguishing True / False / Not Given";
    case "YES_NO_NOT_GIVEN":
      return "Difficulty distinguishing Yes / No / Not Given";
    case "SHORT_ANSWER":
      return "Improve spelling and exact word matching";
    default:
      return `Weak in ${label}`;
  }
}

function generateWeakAreas(questionTypePerformance: readonly QuestionTypePerformance[]): string[] {
  return questionTypePerformance
    .filter((performance) => performance.accuracy !== null && performance.accuracy < 60)
    .map((performance) => weakAreaFor(performance.type, performance.label));
}

function recommendationFor(type: ReadingQuestionType): string {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return "Practice eliminating distractors and scanning for supporting details.";
    case "TRUE_FALSE_NOT_GIVEN":
      return "Practice distinguishing FALSE from NOT GIVEN.";
    case "YES_NO_NOT_GIVEN":
      return "Practice distinguishing NO from NOT GIVEN in the writer's views.";
    case "MATCHING_HEADING":
      return "Practice identifying paragraph main ideas.";
    case "MATCHING_INFORMATION":
      return "Practice locating specific details and paraphrases in the passage.";
    case "MATCHING_FEATURES":
      return "Practice tracking names, categories, and reference words.";
    case "MATCHING_SENTENCE_ENDINGS":
      return "Practice matching grammatical structure and meaning across sentence clauses.";
    case "SENTENCE_COMPLETION":
    case "SUMMARY_COMPLETION":
    case "NOTE_COMPLETION":
    case "TABLE_COMPLETION":
    case "FLOW_CHART_COMPLETION":
    case "DIAGRAM_LABELLING":
      return "Practice keyword scanning and following the required word limit exactly.";
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

/** Evaluates complete and early-submitted Reading attempts without side effects. */
export function evaluateReadingTest(input: ReadingEvaluationInput): ReadingEvaluationResult {
  const evaluatedQuestions = input.questions.map((question) =>
    evaluateQuestion(question, input.answers[question.id])
  );
  const statistics = calculateStatistics(evaluatedQuestions);
  const sectionPerformance = calculateSectionPerformance(evaluatedQuestions);
  const questionTypePerformance = calculateQuestionTypePerformance(evaluatedQuestions);
  const status: EvaluationStatus =
    statistics.attemptedQuestions === statistics.totalQuestions ? "Completed" : "Incomplete";
  const band = calculateBand(statistics.correctAnswers, input.module);

  return {
    status,
    ...statistics,
    overallBand: status === "Completed" ? band : null,
    estimatedBand: status === "Incomplete" ? band : null,
    sectionPerformance,
    questionTypePerformance,
    strengths: generateStrengths(
      statistics.attemptAccuracy,
      sectionPerformance,
      questionTypePerformance
    ),
    weakAreas: generateWeakAreas(questionTypePerformance),
    recommendations: generateRecommendations(questionTypePerformance),
  };
}

/**
 * Backwards-compatible score used by existing persisted ReadingResult fields.
 * New callers should use `evaluateReadingTest`.
 */
type ScoreableQuestion = {
  id: string;
  correctAnswer: string[];
  marks: number;
};

export type ReadingScore = {
  correctAnswers: number;
  totalQuestions: number;
  rawScore: number;
  totalMarks: number;
  percentage: number;
  bandScore: number;
  algorithmVersion: "basic-v1";
};

export function calculateBasicReadingScore(
  questions: readonly ScoreableQuestion[],
  answers: Readonly<Record<string, string | undefined>>
): ReadingScore {
  let correctAnswers = 0;
  let rawScore = 0;
  const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);

  for (const question of questions) {
    const submitted = answers[question.id];
    if (typeof submitted !== "string" || normalizeAnswer(submitted).length === 0) continue;

    if (question.correctAnswer.some((answer) => isExactMatch(submitted, answer))) {
      correctAnswers += 1;
      rawScore += question.marks;
    }
  }

  const percentage = totalMarks === 0 ? 0 : (rawScore / totalMarks) * 100;
  const bandScore = Number((Math.round(((percentage / 100) * 9) * 2) / 2).toFixed(1));

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
