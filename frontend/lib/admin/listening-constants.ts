import type { AdminListeningQuestionType } from "@/types/admin";

export const DEFAULT_QUESTIONS_PER_PART = 10;

export const LISTENING_QUESTION_TYPE_OPTIONS: {
  value: AdminListeningQuestionType;
  label: string;
}[] = [
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "form-completion", label: "Form Completion" },
  { value: "note-completion", label: "Note Completion" },
  { value: "table-completion", label: "Table Completion" },
  { value: "summary-completion", label: "Summary Completion" },
  { value: "sentence-completion", label: "Sentence Completion" },
  { value: "matching", label: "Matching" },
  { value: "map-labelling", label: "Map/Plan/Diagram Labelling" },
  { value: "short-answer", label: "Short Answer" },
];

export const LISTENING_ICON_OPTIONS = [
  { value: "headphones" as const, label: "Headphones" },
  { value: "broadcast" as const, label: "Broadcast" },
  { value: "microphone" as const, label: "Microphone" },
];

export const MAX_LISTENING_AUDIO_SIZE_MB = 10;
export const MAX_LISTENING_IMAGE_SIZE_MB = 5;

export const LISTENING_AUDIO_ACCEPT = "audio/mpeg,audio/wav,audio/x-m4a,audio/mp4,.mp3,.wav,.m4a";
