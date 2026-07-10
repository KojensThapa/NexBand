export type AdminSectionId =
  | "overview"
  | "writing"
  | "speaking"
  | "listening"
  | "reading";

export const ADMIN_SECTION_IDS: AdminSectionId[] = [
  "overview",
  "writing",
  "speaking",
  "listening",
  "reading",
];

export function isAdminSectionId(value: string): value is AdminSectionId {
  return ADMIN_SECTION_IDS.includes(value as AdminSectionId);
}

export interface AdminNavItem {
  id: AdminSectionId;
  label: string;
  description: string;
  available: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Admin dashboard summary and quick actions.",
    available: true,
  },
  {
    id: "writing",
    label: "Writing",
    description: "Create and manage IELTS Writing questions.",
    available: true,
  },
  {
    id: "speaking",
    label: "Speaking",
    description: "Speaking content management — coming soon.",
    available: false,
  },
  {
    id: "listening",
    label: "Listening",
    description: "Listening content management — coming soon.",
    available: false,
  },
  {
    id: "reading",
    label: "Reading",
    description: "Reading content management — coming soon.",
    available: false,
  },
];

export function getAdminNavItem(id: AdminSectionId): AdminNavItem {
  return ADMIN_NAV_ITEMS.find((item) => item.id === id) ?? ADMIN_NAV_ITEMS[0];
}
