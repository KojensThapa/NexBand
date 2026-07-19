/**
 * Contract for the later Writing evaluation pipeline.  The learner submit API
 * deliberately stores essays as PENDING_ANALYSIS until implementations for
 * these criteria are available.
 */
export interface WritingCriterionScore {
  score: number;
  feedback: string[];
}

export interface WritingEvaluation {
  grammar: WritingCriterionScore;
  vocabulary: WritingCriterionScore;
  coherence: WritingCriterionScore;
  taskAchievement: WritingCriterionScore;
  finalBandScore: number;
  algorithmVersion: string;
}

export interface WritingAnalysisInput {
  essayId: string;
  taskNumber: 1 | 2;
  prompt: string;
  content: string;
}

export interface WritingCriterionAlgorithm {
  evaluate(input: WritingAnalysisInput): Promise<WritingCriterionScore>;
}
