-- Persist provider-backed speaking submissions separately from the existing
-- coverage-only SpeakingAttempt/SpeakingResult workflow.
CREATE TYPE "SpeakingSubmissionMode" AS ENUM ('PART', 'MOCK');
CREATE TYPE "SpeakingSubmissionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "SpeakingReportScope" AS ENUM ('PART', 'MOCK');

CREATE TABLE "SpeakingSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT,
    "attemptId" TEXT,
    "mode" "SpeakingSubmissionMode" NOT NULL,
    "status" "SpeakingSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SpeakingSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpeakingRecording" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "responseKey" TEXT NOT NULL,
    "partNumber" INTEGER NOT NULL,
    "audioUrl" TEXT,
    "audioStorageKey" TEXT,
    "mimeType" TEXT,
    "transcript" TEXT,
    "durationSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SpeakingRecording_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpeakingEvaluation" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "partNumber" INTEGER NOT NULL,
    "transcript" TEXT NOT NULL,
    "grammarScore" DOUBLE PRECISION NOT NULL,
    "pronunciationScore" DOUBLE PRECISION NOT NULL,
    "pronunciationConfidence" DOUBLE PRECISION NOT NULL,
    "grammarErrors" JSONB NOT NULL,
    "grammarSuggestions" JSONB NOT NULL,
    "mispronouncedWords" JSONB NOT NULL,
    "providerData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpeakingEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpeakingReport" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reportKey" TEXT NOT NULL,
    "scope" "SpeakingReportScope" NOT NULL,
    "status" "SpeakingSubmissionStatus" NOT NULL DEFAULT 'COMPLETED',
    "partNumber" INTEGER,
    "transcript" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "wordsPerMinute" DOUBLE PRECISION NOT NULL,
    "fluencyScore" DOUBLE PRECISION NOT NULL,
    "vocabularyScore" DOUBLE PRECISION NOT NULL,
    "grammarScore" DOUBLE PRECISION NOT NULL,
    "pronunciationScore" DOUBLE PRECISION NOT NULL,
    "overallBand" DOUBLE PRECISION NOT NULL,
    "cefrLevel" TEXT NOT NULL,
    "fillerWords" JSONB NOT NULL,
    "mispronouncedWords" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "weakAreas" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "evaluationData" JSONB NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SpeakingReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SpeakingSubmission_attemptId_key" ON "SpeakingSubmission"("attemptId");
CREATE INDEX "SpeakingSubmission_userId_createdAt_idx" ON "SpeakingSubmission"("userId", "createdAt");
CREATE INDEX "SpeakingSubmission_testId_idx" ON "SpeakingSubmission"("testId");
CREATE INDEX "SpeakingSubmission_status_idx" ON "SpeakingSubmission"("status");
CREATE UNIQUE INDEX "SpeakingRecording_submissionId_partNumber_responseKey_key" ON "SpeakingRecording"("submissionId", "partNumber", "responseKey");
CREATE INDEX "SpeakingRecording_submissionId_partNumber_idx" ON "SpeakingRecording"("submissionId", "partNumber");
CREATE UNIQUE INDEX "SpeakingEvaluation_recordingId_key" ON "SpeakingEvaluation"("recordingId");
CREATE INDEX "SpeakingEvaluation_submissionId_partNumber_idx" ON "SpeakingEvaluation"("submissionId", "partNumber");
CREATE UNIQUE INDEX "SpeakingReport_submissionId_reportKey_key" ON "SpeakingReport"("submissionId", "reportKey");
CREATE INDEX "SpeakingReport_submissionId_scope_idx" ON "SpeakingReport"("submissionId", "scope");

ALTER TABLE "SpeakingSubmission" ADD CONSTRAINT "SpeakingSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpeakingSubmission" ADD CONSTRAINT "SpeakingSubmission_testId_fkey" FOREIGN KEY ("testId") REFERENCES "SpeakingTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SpeakingSubmission" ADD CONSTRAINT "SpeakingSubmission_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "SpeakingAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SpeakingRecording" ADD CONSTRAINT "SpeakingRecording_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "SpeakingSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpeakingEvaluation" ADD CONSTRAINT "SpeakingEvaluation_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "SpeakingSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpeakingEvaluation" ADD CONSTRAINT "SpeakingEvaluation_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "SpeakingRecording"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpeakingReport" ADD CONSTRAINT "SpeakingReport_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "SpeakingSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
