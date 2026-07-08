import type { SavedReport } from "@/types/report";

const STORAGE_KEY = "nexband-reports";

export function getSavedReports(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedReport[];
  } catch {
    return [];
  }
}

export function getSavedReport(id: string): SavedReport | undefined {
  return getSavedReports().find((report) => report.id === id);
}

export function saveReport(report: SavedReport): void {
  const existing = getSavedReports();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([report, ...existing]));
}

export function deleteReport(id: string): boolean {
  if (typeof window === "undefined") return false;
  const existing = getSavedReports();
  const filtered = existing.filter((report) => report.id !== id);
  if (filtered.length === existing.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function formatReportDate(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
