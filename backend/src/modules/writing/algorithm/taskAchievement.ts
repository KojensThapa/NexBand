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

function keywordCoverage(essay: string, metadata: WritingQuestionMetadata, provided: number | undefined): number {
  if (provided !== undefined && Number.isFinite(provided)) {
    return Number(Math.max(0, Math.min(1, provided > 1 ? provided / 100 : provided)).toFixed(3));
  }
  const keywords = metadata.expectedKeywords?.map((keyword) => keyword.trim().toLocaleLowerCase("en-US")).filter(Boolean) ?? [];
  if (keywords.length === 0) return 0;
  const normalizedEssay = essay.toLocaleLowerCase("en-US");
  const covered = keywords.filter((keyword) => normalizedEssay.includes(keyword)).length;
  return Number((covered / keywords.length).toFixed(3));
}

export function calculateTaskAchievement(
  essay: string,
  taskNumber: WritingTaskNumber,
  essayAnalysis: EssayAnalysis,
  metadata: WritingQuestionMetadata
): TaskAchievementMetrics {
  const text = essay.toLocaleLowerCase("en-US");
  const coverage = keywordCoverage(essay, metadata, essayAnalysis.keywordCoverage);

  if (taskNumber === 1) {
    const overviewPresent = includesAny(text, [/\boverall\b/, /\bin general\b/, /\bit is clear\b/, /\bbroadly\b/]);
    const mainTrendPresent = includesAny(text, [/\bincreas(?:e|ed|ing)\b/, /\bdecreas(?:e|ed|ing)\b/, /\br[io]se\b/, /\bf[ae]ll\b/, /\bdeclin(?:e|ed|ing)\b/, /\bgrow(?:th|s|ing)?\b/]);
    const comparisonPresent = includesAny(text, [/\bcompared\b/, /\bwhereas\b/, /\bmore than\b/, /\bless than\b/, /\bhigher\b/, /\blower\b/]);
    const dataDescriptionPresent = /\d|%|\bpercent(?:age)?\b|\bfigure\b|\bnumber\b/.test(text);
    const localScore = 4 + ([overviewPresent, mainTrendPresent, comparisonPresent, dataDescriptionPresent].filter(Boolean).length / 4) * 4 + coverage * 0.5;
    const providerScore = providerBand(essayAnalysis.taskAchievementScore);
    return {
      score: Number(Math.min(9, providerScore === undefined ? localScore : localScore * 0.45 + providerScore * 0.55).toFixed(2)),
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
  const providerScore = providerBand(essayAnalysis.taskAchievementScore);

  return {
    score: Number(Math.min(9, providerScore === undefined ? localScore : localScore * 0.45 + providerScore * 0.55).toFixed(2)),
    introductionPresent,
    opinionPresent,
    supportingIdeasPresent,
    examplesPresent,
    conclusionPresent,
    keywordCoverage: coverage,
  };
}

