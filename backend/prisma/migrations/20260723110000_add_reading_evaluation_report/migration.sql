-- Add the remaining IELTS Reading question type supported by the evaluator.
ALTER TYPE "ReadingQuestionType" ADD VALUE IF NOT EXISTS 'YES_NO_NOT_GIVEN';

-- Persist the full deterministic evaluation so a submitted attempt can be
-- rendered as the same report after the learner returns to it.
ALTER TABLE "ReadingResult" ADD COLUMN IF NOT EXISTS "report" JSONB;
