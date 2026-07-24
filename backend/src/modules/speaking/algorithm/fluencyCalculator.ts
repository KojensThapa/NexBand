import type { FluencyMetrics, SpeakingPace } from "./types";

export function tokenizeTranscript(transcript: string): string[] {
  return transcript.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
}

function sentenceCount(transcript: string, totalWords: number): number {
  const sentences = transcript
    .trim()
    .split(/[.!?]+(?:\s+|$)/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  // A transcription without terminal punctuation is still one response.
  return sentences.length || (totalWords > 0 ? 1 : 0);
}

function paceFor(wordsPerMinute: number): SpeakingPace {
  if (wordsPerMinute < 90) return "TOO_SLOW";
  if (wordsPerMinute > 165) return "TOO_FAST";
  return "NORMAL";
}

function clampBand(score: number): number {
  return Math.max(0, Math.min(9, Number(score.toFixed(2))));
}

function paceScore(wordsPerMinute: number): number {
  if (wordsPerMinute <= 0) return 0;
  if (wordsPerMinute < 60) return 3 + (wordsPerMinute / 60) * 1.5;
  if (wordsPerMinute < 90) return 4.5 + ((wordsPerMinute - 60) / 30) * 1.5;
  if (wordsPerMinute <= 165) return 7 + Math.min(1, (wordsPerMinute - 90) / 75) * 1;
  if (wordsPerMinute <= 200) return 7 - ((wordsPerMinute - 165) / 35) * 1.5;
  return Math.max(3.5, 5.5 - ((wordsPerMinute - 200) / 60));
}

function sentenceLengthScore(averageSentenceLength: number): number {
  if (averageSentenceLength <= 0) return 0;
  if (averageSentenceLength < 4) return 4.5;
  if (averageSentenceLength < 7) return 5.5;
  if (averageSentenceLength <= 24) return 7.5;
  if (averageSentenceLength <= 35) return 6.5;
  return 5.5;
}

export function calculateFluency(transcript: string, durationSeconds: number): FluencyMetrics {
  const totalWords = tokenizeTranscript(transcript).length;
  const totalSentences = sentenceCount(transcript, totalWords);
  const averageSentenceLength = totalSentences === 0 ? 0 : totalWords / totalSentences;
  const wordsPerMinute = durationSeconds > 0 ? (totalWords / durationSeconds) * 60 : 0;
  const speakingPace = paceFor(wordsPerMinute);
  const score = clampBand(paceScore(wordsPerMinute) * 0.65 + sentenceLengthScore(averageSentenceLength) * 0.35);

  return {
    totalWords,
    totalSentences,
    averageSentenceLength: Number(averageSentenceLength.toFixed(2)),
    wordsPerMinute: Number(wordsPerMinute.toFixed(2)),
    speakingPace,
    score,
  };
}

