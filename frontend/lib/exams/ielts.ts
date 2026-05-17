import type { IeltsSkill } from "@/types/exam";

export const IELTS_SECTIONS: {
  skill: IeltsSkill;
  label: string;
  durationMinutes: number;
  path: string;
}[] = [
  {
    skill: "speaking",
    label: "Speaking",
    durationMinutes: 15,
    path: "/test/ielts/speaking",
  },
  {
    skill: "writing",
    label: "Writing",
    durationMinutes: 60,
    path: "/test/ielts/writing",
  },
  {
    skill: "reading",
    label: "Reading",
    durationMinutes: 60,
    path: "/test/ielts/reading",
  },
  {
    skill: "listening",
    label: "Listening",
    durationMinutes: 30,
    path: "/test/ielts/listening",
  },
];

export const IELTS_BAND_RANGE = { min: 0, max: 9, step: 0.5 } as const;
