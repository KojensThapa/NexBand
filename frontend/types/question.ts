export interface Question {
  id: string;
  prompt: string;
  type: "text" | "audio" | "multiple_choice";
  options?: string[];
  timeLimitSeconds?: number;
}
