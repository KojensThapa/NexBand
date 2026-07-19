-- CreateEnum
CREATE TYPE "SpeakingCategory" AS ENUM ('MOCK', 'PART_1', 'PART_2', 'PART_3');

-- CreateEnum
CREATE TYPE "SpeakingAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "SpeakingEvaluationMode" AS ENUM ('BASIC', 'AI');

-- CreateTable
CREATE TABLE "SpeakingTest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "SpeakingCategory" NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeakingTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingPart" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "partNumber" INTEGER NOT NULL,
    "cueCardTitle" TEXT,
    "cueCardDescription" TEXT,
    "bulletPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "closingQuestion" TEXT,
    "preparationMinutes" INTEGER NOT NULL DEFAULT 1,
    "speakingMinutes" INTEGER NOT NULL DEFAULT 2,
    "durationMinutes" INTEGER NOT NULL DEFAULT 5,
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeakingPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingQuestion" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeakingQuestion_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "SpeakingPart_testId_partNumber_key" ON "SpeakingPart"("testId", "partNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SpeakingQuestion_partId_questionNumber_key" ON "SpeakingQuestion"("partId", "questionNumber");

-- CreateIndex
CREATE INDEX "SpeakingAttempt_userId_updatedAt_idx" ON "SpeakingAttempt"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SpeakingAttempt_testId_idx" ON "SpeakingAttempt"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeakingResult_attemptId_key" ON "SpeakingResult"("attemptId");

-- CreateIndex
CREATE INDEX "SpeakingResult_userId_createdAt_idx" ON "SpeakingResult"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "SpeakingPart" ADD CONSTRAINT "SpeakingPart_testId_fkey" FOREIGN KEY ("testId") REFERENCES "SpeakingTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingQuestion" ADD CONSTRAINT "SpeakingQuestion_partId_fkey" FOREIGN KEY ("partId") REFERENCES "SpeakingPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingAttempt" ADD CONSTRAINT "SpeakingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingAttempt" ADD CONSTRAINT "SpeakingAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "SpeakingTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingResult" ADD CONSTRAINT "SpeakingResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "SpeakingAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingResult" ADD CONSTRAINT "SpeakingResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
