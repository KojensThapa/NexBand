import type {
  CoherenceMetrics,
  GrammarResult,
  TaskAchievementMetrics,
  VocabularyMetrics,
  WordCountMetrics,
  WritingTaskNumber,
} from "./types";

export interface WritingFeedbackInput {
  taskNumber: WritingTaskNumber;
  wordCount: WordCountMetrics;
  vocabulary: VocabularyMetrics;
  grammar: GrammarResult;
  grammarScore: number;
  taskAchievement: TaskAchievementMetrics;
  coherence: CoherenceMetrics;
}

export interface WritingFeedback {
  strengths: string[];
  weakAreas: string[];
}

export function generateFeedback(input: WritingFeedbackInput): WritingFeedback {
  const strengths: string[] = [];
  const weakAreas: string[] = [];

  if (input.coherence.paragraphCount >= (input.taskNumber === 1 ? 2 : 4)) {
    strengths.push("Clear paragraph organisation.");
  }
  if (input.coherence.transitionWordCount + input.coherence.linkingWordCount >= 3) {
    strengths.push("Strong logical progression.");
  }
  if (input.vocabulary.vocabularyDiversity >= 0.65) strengths.push("Good vocabulary diversity.");
  if (input.grammarScore >= 7 && input.grammar.grammarErrors.length <= 2) {
    strengths.push("Few grammar mistakes.");
  }
  if (input.taskNumber === 1 && input.taskAchievement.comparisonPresent) {
    strengths.push("Good comparison language.");
  }

  if (input.wordCount.isBelowMinimum) weakAreas.push("Low word count.");
  if (input.vocabulary.repeatedWords.some((word) => word.count >= 4) || input.vocabulary.vocabularyDiversity < 0.45) {
    weakAreas.push("Repeated vocabulary.");
  }
  if (input.taskNumber === 1 && !input.taskAchievement.overviewPresent) weakAreas.push("Weak overview.");
  if (input.taskNumber === 2 && !input.taskAchievement.conclusionPresent) weakAreas.push("Missing conclusion.");
  if (input.taskAchievement.offTopic) weakAreas.push("Essay does not address the question.");
  else if (!input.taskAchievement.answeredQuestion) weakAreas.push("Question is not answered clearly.");
  if (!input.taskAchievement.coveredAllParts) weakAreas.push("One or more required discussion points are missing.");
  if (input.grammar.grammarErrors.length + input.grammar.spellingErrors.length + input.grammar.punctuationErrors.length >= 4 || input.grammarScore < 5.5) {
    weakAreas.push("Grammar mistakes affect accuracy.");
  }
  if (input.coherence.transitionWordCount + input.coherence.linkingWordCount < 2 || input.coherence.paragraphCount < 2) {
    weakAreas.push("Poor transitions between ideas.");
  }

  return { strengths: [...new Set(strengths)], weakAreas: [...new Set(weakAreas)] };
}
