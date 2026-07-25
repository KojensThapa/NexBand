-- Persist provider-backed Writing task and mock evaluations independently
-- from the existing learner draft/attempt workflow.
CREATE TYPE "WritingSubmissionMode" AS ENUM ('TASK', 'MOCK');
CREATE TYPE "WritingSubmissionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "WritingReportScope" AS ENUM ('TASK', 'MOCK');

CREATE TABLE "WritingSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT,
    "attemptId" TEXT,
    "mode" "WritingSubmissionMode" NOT NULL,
    "status" "WritingSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WritingSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WritingEvaluation" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "taskId" TEXT,
    "taskNumber" INTEGER NOT NULL,
    "essay" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "uniqueWords" INTEGER NOT NULL,
    "repeatedWords" JSONB NOT NULL,
    "grammarScore" DOUBLE PRECISION NOT NULL,
    "vocabularyScore" DOUBLE PRECISION NOT NULL,
    "taskAchievementScore" DOUBLE PRECISION NOT NULL,
    "coherenceScore" DOUBLE PRECISION NOT NULL,
    "grammarErrors" JSONB NOT NULL,
    "spellingErrors" JSONB NOT NULL,
    "punctuationErrors" JSONB NOT NULL,
    "grammarSuggestions" JSONB NOT NULL,
    "providerData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WritingEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WritingReport" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reportKey" TEXT NOT NULL,
    "scope" "WritingReportScope" NOT NULL,
    "status" "WritingSubmissionStatus" NOT NULL DEFAULT 'COMPLETED',
    "taskNumber" INTEGER,
    "wordCount" INTEGER NOT NULL,
    "uniqueWords" INTEGER NOT NULL,
    "repeatedWords" JSONB NOT NULL,
    "grammarScore" DOUBLE PRECISION NOT NULL,
    "vocabularyScore" DOUBLE PRECISION NOT NULL,
    "taskAchievementScore" DOUBLE PRECISION NOT NULL,
    "coherenceScore" DOUBLE PRECISION NOT NULL,
    "overallBand" DOUBLE PRECISION NOT NULL,
    "cefrLevel" TEXT NOT NULL,
    "grammarErrors" JSONB NOT NULL,
    "spellingErrors" JSONB NOT NULL,
    "punctuationErrors" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "weakAreas" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "evaluationData" JSONB NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WritingReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WritingSubmission_attemptId_key" ON "WritingSubmission"("attemptId");
CREATE INDEX "WritingSubmission_userId_createdAt_idx" ON "WritingSubmission"("userId", "createdAt");
CREATE INDEX "WritingSubmission_testId_idx" ON "WritingSubmission"("testId");
CREATE INDEX "WritingSubmission_status_idx" ON "WritingSubmission"("status");
CREATE UNIQUE INDEX "WritingEvaluation_submissionId_taskNumber_key" ON "WritingEvaluation"("submissionId", "taskNumber");
CREATE INDEX "WritingEvaluation_submissionId_taskNumber_idx" ON "WritingEvaluation"("submissionId", "taskNumber");
CREATE INDEX "WritingEvaluation_taskId_idx" ON "WritingEvaluation"("taskId");
CREATE UNIQUE INDEX "WritingReport_submissionId_reportKey_key" ON "WritingReport"("submissionId", "reportKey");
CREATE INDEX "WritingReport_submissionId_scope_idx" ON "WritingReport"("submissionId", "scope");

ALTER TABLE "WritingSubmission" ADD CONSTRAINT "WritingSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WritingSubmission" ADD CONSTRAINT "WritingSubmission_testId_fkey" FOREIGN KEY ("testId") REFERENCES "WritingTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WritingSubmission" ADD CONSTRAINT "WritingSubmission_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "WritingAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WritingEvaluation" ADD CONSTRAINT "WritingEvaluation_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WritingSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WritingEvaluation" ADD CONSTRAINT "WritingEvaluation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WritingTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WritingReport" ADD CONSTRAINT "WritingReport_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WritingSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
