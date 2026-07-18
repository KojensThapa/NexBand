-- CreateEnum
CREATE TYPE "ListeningQuestionType" AS ENUM ('MULTIPLE_CHOICE', 'FORM_COMPLETION', 'NOTE_COMPLETION', 'TABLE_COMPLETION', 'SUMMARY_COMPLETION', 'SENTENCE_COMPLETION', 'MATCHING', 'MAP_LABELLING', 'SHORT_ANSWER');

-- CreateEnum
CREATE TYPE "ListeningIconStyle" AS ENUM ('headphones', 'broadcast', 'microphone');

-- CreateTable
CREATE TABLE "ListeningMockTest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "iconStyle" "ListeningIconStyle" NOT NULL DEFAULT 'headphones',
    "totalQuestions" INTEGER NOT NULL DEFAULT 40,
    "totalMinutes" INTEGER NOT NULL DEFAULT 32,
    "bufferSeconds" INTEGER NOT NULL DEFAULT 30,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListeningMockTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListeningPart" (
    "id" TEXT NOT NULL,
    "mockTestId" TEXT NOT NULL,
    "partNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "transcript" TEXT,
    "audioStorageKey" TEXT,
    "audioUrl" TEXT,
    "audioDurationSeconds" INTEGER NOT NULL,
    "mapImageUrl" TEXT,
    "mapImageAlt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListeningPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListeningQuestion" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "type" "ListeningQuestionType" NOT NULL,
    "questionText" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "correctAnswer" TEXT NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListeningQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListeningPart_mockTestId_partNumber_key" ON "ListeningPart"("mockTestId", "partNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ListeningQuestion_partId_questionNumber_key" ON "ListeningQuestion"("partId", "questionNumber");

-- AddForeignKey
ALTER TABLE "ListeningPart" ADD CONSTRAINT "ListeningPart_mockTestId_fkey" FOREIGN KEY ("mockTestId") REFERENCES "ListeningMockTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListeningQuestion" ADD CONSTRAINT "ListeningQuestion_partId_fkey" FOREIGN KEY ("partId") REFERENCES "ListeningPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
