import type { ListeningAnswers } from "../listening.schemas";

type ScoreableListeningQuestion = {
  id: string;
  correctAnswer: string;
  marks: number;
};

export type BasicListeningScore = {
  correctAnswers: number;
  totalQuestions: number;
  rawScore: number;
  totalMarks: number;
  percentage: number;
  bandScore: number;
  algorithmVersion: "basic-v1";
};

function normalizeAnswer(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

/**
 * Provisional scorer for the initial listening release. It awards a question's
 * configured marks only for an exact normalized answer and derives a simple
 * 0-9 band estimate. Replace this module when IELTS-specific conversion,
 * alternate answers, or partial marking rules are introduced.
 */
export function calculateBasicListeningScore(
  questions: ScoreableListeningQuestion[],
  answers: ListeningAnswers
): BasicListeningScore {
  let correctAnswers = 0;
  let rawScore = 0;
  const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);

  for (const question of questions) {
    const submittedAnswer = answers[question.id];
    if (!submittedAnswer) continue;

    if (normalizeAnswer(submittedAnswer) === normalizeAnswer(question.correctAnswer)) {
      correctAnswers += 1;
      rawScore += question.marks;
    }
  }

  const percentage = totalMarks === 0 ? 0 : (rawScore / totalMarks) * 100;
  const bandScore = Number((Math.round((percentage / 100) * 9 * 2) / 2).toFixed(1));

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
