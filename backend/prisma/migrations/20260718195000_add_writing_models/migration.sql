-- CreateEnum
CREATE TYPE "WritingCategory" AS ENUM ('MOCK', 'TASK_1', 'TASK_2');

-- CreateEnum
CREATE TYPE "WritingTask1Type" AS ENUM ('GRAPH', 'CHART', 'TABLE', 'MAP', 'PROCESS', 'DIAGRAM', 'PIE');

-- CreateTable
CREATE TABLE "WritingTest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "WritingCategory" NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WritingTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WritingTask" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "taskNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "typeLabel" TEXT,
    "task1Type" "WritingTask1Type",
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WritingTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WritingTask_testId_taskNumber_key" ON "WritingTask"("testId", "taskNumber");

-- AddForeignKey
ALTER TABLE "WritingTask" ADD CONSTRAINT "WritingTask_testId_fkey" FOREIGN KEY ("testId") REFERENCES "WritingTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
