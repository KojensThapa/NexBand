-- Persist the explicit relevance score and confidence alongside the complete
-- JSON evaluation report, while preserving all previously stored reports.
ALTER TABLE "SpeakingReport"
  ADD COLUMN "responseRelevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 6,
  ADD COLUMN "responseRelevance" JSONB,
  ADD COLUMN "speechToTextConfidence" DOUBLE PRECISION;
