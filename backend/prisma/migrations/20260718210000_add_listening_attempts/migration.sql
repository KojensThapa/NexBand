-- CreateEnum
CREATE TYPE "ListeningAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

-- CreateTable
CREATE TABLE "ListeningAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mockTestId" TEXT NOT NULL,
    "status" "ListeningAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "answers" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListeningAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListeningResult" (
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

    CONSTRAINT "ListeningResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListeningAttempt_userId_updatedAt_idx" ON "ListeningAttempt"("userId", "updatedAt");
CREATE INDEX "ListeningAttempt_mockTestId_idx" ON "ListeningAttempt"("mockTestId");
CREATE UNIQUE INDEX "ListeningResult_attemptId_key" ON "ListeningResult"("attemptId");
CREATE INDEX "ListeningResult_userId_createdAt_idx" ON "ListeningResult"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ListeningAttempt" ADD CONSTRAINT "ListeningAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListeningAttempt" ADD CONSTRAINT "ListeningAttempt_mockTestId_fkey" FOREIGN KEY ("mockTestId") REFERENCES "ListeningMockTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListeningResult" ADD CONSTRAINT "ListeningResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ListeningAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListeningResult" ADD CONSTRAINT "ListeningResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
