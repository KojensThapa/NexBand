-- The earlier 20260718193000 migration already created the base speaking
-- models. Upgrade those tables in place so existing authored tests and
-- questions are preserved rather than attempting to recreate their enum and
-- tables.

-- CreateEnum
CREATE TYPE "SpeakingAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "SpeakingEvaluationMode" AS ENUM ('BASIC', 'AI');

-- Rename the existing base test model to the final API model.
ALTER TABLE "SpeakingMockTest" RENAME TO "SpeakingTest";
ALTER TABLE "SpeakingTest" RENAME CONSTRAINT "SpeakingMockTest_pkey" TO "SpeakingTest_pkey";

ALTER TABLE "SpeakingPart" RENAME COLUMN "mockTestId" TO "testId";
ALTER TABLE "SpeakingPart" RENAME CONSTRAINT "SpeakingPart_mockTestId_fkey" TO "SpeakingPart_testId_fkey";
ALTER INDEX "SpeakingPart_mockTestId_partNumber_key" RENAME TO "SpeakingPart_testId_partNumber_key";
ALTER TABLE "SpeakingPart" ADD COLUMN "durationMinutes" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "SpeakingAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "status" "SpeakingAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "recordings" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeakingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingResult" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordingCount" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "totalDurationSeconds" INTEGER NOT NULL,
    "completionPercentage" DOUBLE PRECISION NOT NULL,
    "basicScore" DOUBLE PRECISION NOT NULL,
    "estimatedBandScore" DOUBLE PRECISION NOT NULL,
    "evaluationMode" "SpeakingEvaluationMode" NOT NULL DEFAULT 'BASIC',
    "algorithmVersion" TEXT NOT NULL DEFAULT 'basic-v1',
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpeakingResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpeakingAttempt_userId_updatedAt_idx" ON "SpeakingAttempt"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SpeakingAttempt_testId_idx" ON "SpeakingAttempt"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeakingResult_attemptId_key" ON "SpeakingResult"("attemptId");

-- CreateIndex
CREATE INDEX "SpeakingResult_userId_createdAt_idx" ON "SpeakingResult"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "SpeakingAttempt" ADD CONSTRAINT "SpeakingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingAttempt" ADD CONSTRAINT "SpeakingAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "SpeakingTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingResult" ADD CONSTRAINT "SpeakingResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "SpeakingAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingResult" ADD CONSTRAINT "SpeakingResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
