-- CreateEnum
CREATE TYPE "ReadingAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

-- CreateTable
CREATE TABLE "ReadingAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mockTestId" TEXT NOT NULL,
    "status" "ReadingAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "answers" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingResult" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "rawScore" INTEGER NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "bandScore" DOUBLE PRECISION NOT NULL,
    "algorithmVersion" TEXT NOT NULL DEFAULT 'basic-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadingAttempt_userId_updatedAt_idx" ON "ReadingAttempt"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ReadingAttempt_mockTestId_idx" ON "ReadingAttempt"("mockTestId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingResult_attemptId_key" ON "ReadingResult"("attemptId");

-- CreateIndex
CREATE INDEX "ReadingResult_userId_createdAt_idx" ON "ReadingResult"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ReadingAttempt" ADD CONSTRAINT "ReadingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingAttempt" ADD CONSTRAINT "ReadingAttempt_mockTestId_fkey" FOREIGN KEY ("mockTestId") REFERENCES "ReadingMockTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingResult" ADD CONSTRAINT "ReadingResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ReadingAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingResult" ADD CONSTRAINT "ReadingResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
