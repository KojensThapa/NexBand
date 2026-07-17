-- CreateEnum
CREATE TYPE "ReadingQuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE_NOT_GIVEN', 'MATCHING_HEADING', 'MATCHING_INFORMATION', 'MATCHING_FEATURES', 'MATCHING_SENTENCE_ENDINGS', 'SENTENCE_COMPLETION', 'SUMMARY_COMPLETION', 'NOTE_COMPLETION', 'TABLE_COMPLETION', 'FLOW_CHART_COMPLETION', 'DIAGRAM_LABELLING', 'SHORT_ANSWER');

-- CreateTable
CREATE TABLE "ReadingMockTest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tags" TEXT[],
    "duration" INTEGER NOT NULL DEFAULT 60,
    "totalQuestions" INTEGER NOT NULL DEFAULT 40,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingMockTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingPassage" (
    "id" TEXT NOT NULL,
    "mockTestId" TEXT NOT NULL,
    "passageNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT,
    "passageText" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingPassage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingQuestion" (
    "id" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "type" "ReadingQuestionType" NOT NULL,
    "questionText" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" TEXT[],
    "marks" INTEGER NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadingPassage_mockTestId_passageNumber_key" ON "ReadingPassage"("mockTestId", "passageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingQuestion_passageId_questionNumber_key" ON "ReadingQuestion"("passageId", "questionNumber");

-- AddForeignKey
ALTER TABLE "ReadingPassage" ADD CONSTRAINT "ReadingPassage_mockTestId_fkey" FOREIGN KEY ("mockTestId") REFERENCES "ReadingMockTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingQuestion" ADD CONSTRAINT "ReadingQuestion_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "ReadingPassage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
