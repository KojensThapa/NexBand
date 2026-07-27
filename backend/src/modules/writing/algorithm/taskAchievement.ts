import type {
  EssayAnalysis,
  TaskAchievementMetrics,
  WritingQuestionMetadata,
  WritingTaskNumber,
} from "./types";

function includesAny(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function providerBand(score: number | undefined): number | undefined {
  if (score === undefined || !Number.isFinite(score)) return undefined;
  return Math.max(0, Math.min(9, score > 9 ? (score / 100) * 9 : score));
}

function normalizeRatio(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Number(Math.max(0, Math.min(1, value > 1 ? value / 100 : value)).toFixed(3));
}

const QUESTION_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "both", "by", "compare", "describe", "discuss", "do",
  "does", "each", "essay", "example", "examples", "explain", "for", "from", "give", "how", "in", "is",
  "it", "its", "of", "on", "or", "question", "should", "summarise", "summarize", "task", "that", "the",
  "these", "this", "to", "views", "what", "whether", "why", "with", "write", "you", "your",
]);

function normalizeQuestionToken(value: string): string {
  const normalized = value.trim().toLocaleLowerCase("en-US");
  if (normalized.endsWith("ies") && normalized.length > 4) return `${normalized.slice(0, -3)}y`;
  if (normalized.endsWith("s") && !normalized.endsWith("ss") && normalized.length > 3) {
    return normalized.slice(0, -1);
  }
  return normalized;
}

function extractQuestionKeywords(value: string | undefined): string[] {
  const tokens = value?.match(/[A-Za-z0-9]+/g) ?? [];
  return [...new Set(
    tokens
      .map(normalizeQuestionToken)
      .filter((token) => token.length > 2 && !QUESTION_STOP_WORDS.has(token)),
  )];
}

function questionKeywords(metadata: WritingQuestionMetadata): string[] {
  const expected = metadata.expectedKeywords?.flatMap((keyword) => extractQuestionKeywords(keyword)) ?? [];
  // Test authors can supply expected keywords for precision. Prompt keywords
  // provide a deterministic fallback when that metadata has not been entered.
  return [...new Set(expected.length > 0 ? expected : extractQuestionKeywords(metadata.prompt))];
}

function keywordCoverage(
  essay: string,
  provided: number | undefined,
  keywords: readonly string[]
): number {
  if (provided !== undefined && Number.isFinite(provided)) {
    return normalizeRatio(provided, 0);
  }
  if (keywords.length === 0) return 0;
  const essayKeywords = new Set(extractQuestionKeywords(essay));
  const covered = keywords.filter((keyword) => essayKeywords.has(keyword)).length;
  return Number((covered / keywords.length).toFixed(3));
}

function applyRelevanceRules(
  blendedScore: number,
  analysis: EssayAnalysis,
  coverage: number,
  questionKeywords: readonly string[],
  essay: string
): Pick<TaskAchievementMetrics, "score" | "answeredQuestion" | "coveredAllParts" | "offTopic" | "relevanceScore" | "missingPoints"> {
  const hasQuestionKeywords = questionKeywords.length > 0;
  const relevanceScore = normalizeRatio(analysis.relevanceScore, hasQuestionKeywords ? coverage : 1);
  const essayWordCount = essay.match(/[A-Za-z0-9]+/g)?.length ?? 0;
  // For a focused question such as "Write about apples", zero overlap in a
  // substantive response is reliable local evidence of an off-topic answer.
  // Broader IELTS prompts are left to Gemini or the normal relevance penalty
  // to avoid false positives from synonyms and paraphrasing.
  const localOffTopic =
    analysis.offTopic === undefined &&
    analysis.relevanceScore === undefined &&
    hasQuestionKeywords &&
    questionKeywords.length <= 2 &&
    essayWordCount >= 8 &&
    relevanceScore <= 0.05;
  const offTopic = analysis.offTopic ?? localOffTopic;
  const answeredQuestion = analysis.answeredQuestion ?? (!offTopic && relevanceScore >= 0.1);
  const coveredAllParts = analysis.coveredAllParts ?? true;
  const missingPoints = [...new Set(analysis.missingPoints ?? [])];

  let score = blendedScore;
  if (!coveredAllParts) {
    // Missing a required discussion point must materially lower task response.
    score -= Math.min(2, 0.6 + missingPoints.length * 0.3);
  }
  if (!answeredQuestion) score = Math.min(score, 3);
  if (relevanceScore < 0.5) score -= (0.5 - relevanceScore) * 2;
  // Gemini's explicit off-topic finding is authoritative; do not allow strong
  // local structure or vocabulary to inflate Task Achievement above Band 2.
  if (offTopic) score = Math.min(score, 2);

  return {
    score: Number(Math.max(0, Math.min(9, score)).toFixed(2)),
    answeredQuestion,
    coveredAllParts,
    offTopic,
    relevanceScore,
    missingPoints,
  };
}

function blendTaskAchievement(localScore: number, analysis: EssayAnalysis): number {
  const providerScore = providerBand(analysis.taskAchievementScore);
  // Required weighting: 80% Gemini, 20% deterministic local evidence.
  return providerScore === undefined ? localScore : providerScore * 0.8 + localScore * 0.2;
}

export function calculateTaskAchievement(
  essay: string,
  taskNumber: WritingTaskNumber,
  essayAnalysis: EssayAnalysis,
  metadata: WritingQuestionMetadata
): TaskAchievementMetrics {
  const text = essay.toLocaleLowerCase("en-US");
  const promptKeywords = questionKeywords(metadata);
  const coverage = keywordCoverage(essay, essayAnalysis.keywordCoverage, promptKeywords);

  if (taskNumber === 1) {
    const overviewPresent = includesAny(text, [/\boverall\b/, /\bin general\b/, /\bit is clear\b/, /\bbroadly\b/]);
    const mainTrendPresent = includesAny(text, [/\bincreas(?:e|ed|ing)\b/, /\bdecreas(?:e|ed|ing)\b/, /\br[io]se\b/, /\bf[ae]ll\b/, /\bdeclin(?:e|ed|ing)\b/, /\bgrow(?:th|s|ing)?\b/]);
    const comparisonPresent = includesAny(text, [/\bcompared\b/, /\bwhereas\b/, /\bmore than\b/, /\bless than\b/, /\bhigher\b/, /\blower\b/]);
    const dataDescriptionPresent = /\d|%|\bpercent(?:age)?\b|\bfigure\b|\bnumber\b/.test(text);
    const localScore = 4 + ([overviewPresent, mainTrendPresent, comparisonPresent, dataDescriptionPresent].filter(Boolean).length / 4) * 4 + coverage * 0.5;
    const relevance = applyRelevanceRules(
      blendTaskAchievement(localScore, essayAnalysis),
      essayAnalysis,
      coverage,
      promptKeywords,
      essay
    );
    return {
      ...relevance,
      overviewPresent,
      mainTrendPresent,
      comparisonPresent,
      dataDescriptionPresent,
      keywordCoverage: coverage,
    };
  }

  const paragraphs = essay.trim().split(/\n\s*\n/).filter(Boolean);
  const introductionPresent = paragraphs.length > 0 && paragraphs[0]!.trim().split(/\s+/).length >= 15;
  const opinionPresent = includesAny(text, [/\bi (?:agree|disagree|believe|think|argue)\b/, /\bin my opinion\b/, /\bfrom my perspective\b/]);
  const supportingIdeasPresent = includesAny(text, [/\bbecause\b/, /\breason\b/, /\bbenefit\b/, /\bdrawback\b/, /\badvantage\b/]);
  const examplesPresent = includesAny(text, [/\bfor example\b/, /\bfor instance\b/, /\bsuch as\b/]);
  const conclusionPresent = includesAny(text, [/\bin conclusion\b/, /\bto conclude\b/, /\bto sum up\b/, /\bin summary\b/]);
  const localScore = 4 + ([introductionPresent, opinionPresent, supportingIdeasPresent, examplesPresent, conclusionPresent].filter(Boolean).length / 5) * 4 + coverage * 0.5;
  const relevance = applyRelevanceRules(
    blendTaskAchievement(localScore, essayAnalysis),
    essayAnalysis,
    coverage,
    promptKeywords,
    essay
  );

  return {
    ...relevance,
    introductionPresent,
    opinionPresent,
    supportingIdeasPresent,
    examplesPresent,
    conclusionPresent,
    keywordCoverage: coverage,
  };
}
