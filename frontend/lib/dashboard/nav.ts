export type DashboardSectionId =
  | "home"
  | "reports"
  | "writing"
  | "speaking"
  | "listening"
  | "reading"
  | "sample-reports"
  | "lessons";

export const DASHBOARD_SECTION_IDS: DashboardSectionId[] = [
  "home",
  "reports",
  "writing",
  "speaking",
  "listening",
  "reading",
  "sample-reports",
  "lessons",
];

export function isDashboardSectionId(value: string): value is DashboardSectionId {
  return DASHBOARD_SECTION_IDS.includes(value as DashboardSectionId);
}

export interface DashboardNavItem {
  id: DashboardSectionId;
  label: string;
  description: string;
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: "home",
    label: "Home",
    description: "Your IELTS practice overview and quick actions.",
  },
  {
    id: "reports",
    label: "My Reports",
    description: "Review your past test results and band score history.",
  },
  {
    id: "writing",
    label: "Writing",
    description: "Practice IELTS Writing with AI scoring and feedback.",
  },
  {
    id: "speaking",
    label: "Speaking",
    description: "Practice IELTS Speaking with AI scoring and feedback.",
  },
  {
    id: "listening",
    label: "Listening",
    description: "Practice IELTS Listening with timed exercises.",
  },
  {
    id: "reading",
    label: "Reading",
    description: "Practice IELTS Reading with comprehension drills.",
  },
  {
    id: "sample-reports",
    label: "Sample Reports",
    description: "Explore band-scored sample answers and model reports.",
  },
  {
    id: "lessons",
    label: "Lessons",
    description: "Structured lessons to improve each IELTS skill.",
  },
];

export function getNavItem(id: DashboardSectionId): DashboardNavItem {
  return DASHBOARD_NAV_ITEMS.find((item) => item.id === id) ?? DASHBOARD_NAV_ITEMS[0];
}
