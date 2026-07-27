import type {
  EssayAnalysis,
  GrammarResult,
  WritingQuestionMetadata,
  WritingTaskNumber,
} from "../algorithm/types";

export class WritingProviderError extends Error {
  constructor(message: string, readonly statusCode = 502) {
    super(message);
    this.name = "WritingProviderError";
  }
}

export interface GrammarProviderRequest {
  essay: string;
  taskNumber: WritingTaskNumber;
  correlationId?: string;
}

export interface EssayProviderRequest {
  essay: string;
  taskNumber: WritingTaskNumber;
  questionMetadata: WritingQuestionMetadata;
  correlationId?: string;
}

export interface GrammarProvider {
  analyze(input: GrammarProviderRequest): Promise<GrammarResult>;
}

export interface EssayAnalysisProvider {
  analyze(input: EssayProviderRequest): Promise<EssayAnalysis>;
}

/** A single provider call that supplies both grammar and essay analysis. */
export interface CombinedWritingAnalysis {
  grammarResult: GrammarResult;
  essayAnalysis: EssayAnalysis;
}

export interface WritingAnalysisProvider {
  analyze(input: EssayProviderRequest): Promise<CombinedWritingAnalysis>;
}
