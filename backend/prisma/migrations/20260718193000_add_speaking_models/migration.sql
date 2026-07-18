-- CreateEnum
CREATE TYPE "SpeakingCategory" AS ENUM ('MOCK', 'PART_1', 'PART_2', 'PART_3');

-- CreateTable
CREATE TABLE "SpeakingMockTest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "SpeakingCategory" NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeakingMockTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingPart" (
    "id" TEXT NOT NULL,
    "mockTestId" TEXT NOT NULL,
    "partNumber" INTEGER NOT NULL,
    "cueCardTitle" TEXT,
    "cueCardDescription" TEXT,
    "bulletPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "closingQuestion" TEXT,
    "preparationMinutes" INTEGER NOT NULL DEFAULT 1,
    "speakingMinutes" INTEGER NOT NULL DEFAULT 2,
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

-- CreateIndex
CREATE UNIQUE INDEX "SpeakingPart_mockTestId_partNumber_key" ON "SpeakingPart"("mockTestId", "partNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SpeakingQuestion_partId_questionNumber_key" ON "SpeakingQuestion"("partId", "questionNumber");

-- AddForeignKey
ALTER TABLE "SpeakingPart" ADD CONSTRAINT "SpeakingPart_mockTestId_fkey" FOREIGN KEY ("mockTestId") REFERENCES "SpeakingMockTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingQuestion" ADD CONSTRAINT "SpeakingQuestion_partId_fkey" FOREIGN KEY ("partId") REFERENCES "SpeakingPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
