-- CreateEnum
CREATE TYPE "WritingAttemptStatus" AS ENUM ('DRAFT', 'PENDING_ANALYSIS');

-- CreateTable
CREATE TABLE "WritingAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "status" "WritingAttemptStatus" NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WritingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WritingEssay" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WritingEssay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WritingAttempt_userId_updatedAt_idx" ON "WritingAttempt"("userId", "updatedAt");
CREATE INDEX "WritingAttempt_testId_idx" ON "WritingAttempt"("testId");
CREATE UNIQUE INDEX "WritingEssay_attemptId_taskId_key" ON "WritingEssay"("attemptId", "taskId");
CREATE INDEX "WritingEssay_taskId_idx" ON "WritingEssay"("taskId");

-- AddForeignKey
ALTER TABLE "WritingAttempt" ADD CONSTRAINT "WritingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WritingAttempt" ADD CONSTRAINT "WritingAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "WritingTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WritingEssay" ADD CONSTRAINT "WritingEssay_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "WritingAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WritingEssay" ADD CONSTRAINT "WritingEssay_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WritingTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
