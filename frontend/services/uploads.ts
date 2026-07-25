import { apiFetch } from "./api";

type ApiEnvelope<T> = { success: true; data: T };

export async function uploadAudioFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("audio", file, file.name);

  const response = await apiFetch<ApiEnvelope<{ url: string }>>("/api/uploads/audio", {
    method: "POST",
    body: formData,
  });

  // Persist the API-relative path, not the administrator's current host. The
  // learner client resolves it against its configured API base URL.
  return response.data.url;
}
