import type { SpeakingRecordings } from "../speaking.schemas";

export type BasicSpeakingEvaluation = {
  recordingCount: number;
  totalQuestions: number;
  totalDurationSeconds: number;
  completionPercentage: number;
  basicScore: number;
  estimatedBandScore: number;
  evaluationMode: "BASIC";
  algorithmVersion: "basic-v1";
  feedback: {
    summary: string;
    strengths: string[];
    improvements: string[];
  };
};

/**
 * A transparent practice-completion evaluator. It can measure only supplied
 * recordings and their duration; it does not claim to assess grammar,
 * vocabulary, pronunciation, or official IELTS bands. Replace this module
 * with a transcription/AI evaluator when audio processing is available.
 */
export function calculateBasicSpeakingEvaluation(
  allowedRecordingKeys: Set<string>,
  recordings: SpeakingRecordings
): BasicSpeakingEvaluation {
  const submitted = Object.entries(recordings).filter(
    ([key, recording]) => allowedRecordingKeys.has(key) && recording.durationSeconds > 0
  );
  const recordingCount = submitted.length;
  const totalQuestions = allowedRecordingKeys.size;
  const totalDurationSeconds = submitted.reduce(
    (sum, [, recording]) => sum + recording.durationSeconds,
    0
  );
  const completionRatio = totalQuestions === 0 ? 0 : recordingCount / totalQuestions;
  const averageDuration = recordingCount === 0 ? 0 : totalDurationSeconds / recordingCount;
  // Reaching 30 seconds per recorded response earns the full duration factor.
  const durationFactor = Math.min(1, averageDuration / 30);
  const basicScore = Number(((completionRatio * 0.7 + durationFactor * 0.3) * 100).toFixed(2));
  const estimatedBandScore = Number(
    (Math.round((3 + (basicScore / 100) * 4) * 2) / 2).toFixed(1)
  );
  const completionPercentage = Number((completionRatio * 100).toFixed(2));

  const strengths: string[] = [];
  const improvements: string[] = [];
  if (completionRatio >= 0.8) {
    strengths.push("You recorded answers for most of the required prompts.");
  } else {
    improvements.push("Record an answer for more prompts to complete the practice set.");
  }
  if (averageDuration >= 30) {
    strengths.push("Your average response duration supports developed practice answers.");
  } else {
    improvements.push("Develop each response for longer before submitting.");
  }

  return {
    recordingCount,
    totalQuestions,
    totalDurationSeconds,
    completionPercentage,
    basicScore,
    estimatedBandScore,
    evaluationMode: "BASIC",
    algorithmVersion: "basic-v1",
    feedback: {
      summary:
        "This is a practice-completion estimate based on recorded-answer coverage and duration, not an IELTS speaking assessment.",
      strengths,
      improvements,
    },
  };
}
