import type { ReadingAnswers } from "../reading.schemas";

type ScoreableQuestion = {
  id: string;
  correctAnswer: string[];
  marks: number;
};

export type ReadingScore = {
  correctAnswers: number;
  totalQuestions: number;
  rawScore: number;
  totalMarks: number;
  percentage: number;
  bandScore: number;
  algorithmVersion: "basic-v1";
};

function normalizeAnswer(answer: string): string {
  return answer
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

/**
 * Current provisional scorer. Replace or extend this module when introducing
 * official IELTS tables, partial marks, or question-type-specific rules.
 */
export function calculateBasicReadingScore(
  questions: ScoreableQuestion[],
  answers: ReadingAnswers
): ReadingScore {
  let correctAnswers = 0;
  let rawScore = 0;
  const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);

  for (const question of questions) {
    const submitted = answers[question.id];
    if (!submitted) continue;

    const normalizedSubmitted = normalizeAnswer(submitted);
    const isCorrect = question.correctAnswer.some(
      (answer) => normalizeAnswer(answer) === normalizedSubmitted
    );

    if (isCorrect) {
      correctAnswers += 1;
      rawScore += question.marks;
    }
  }

  const percentage = totalMarks === 0 ? 0 : (rawScore / totalMarks) * 100;
  const bandScore = Number((Math.round(((percentage / 100) * 9) * 2) / 2).toFixed(1));

  return {
    correctAnswers,
    totalQuestions: questions.length,
    rawScore,
    totalMarks,
    percentage: Number(percentage.toFixed(2)),
    bandScore,
    algorithmVersion: "basic-v1",
  };
}
