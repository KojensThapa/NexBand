import { apiFetch } from "./api";

export interface AiFeedbackPayload {
  testId: string;
  answer: string;
  skill: string;
}

export interface AiFeedbackResponse {
  bandScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export async function requestAiFeedback(
  payload: AiFeedbackPayload
): Promise<AiFeedbackResponse> {
  return apiFetch<AiFeedbackResponse>("/ai/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
