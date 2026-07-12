"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getAdminNavItem,
  isAdminSectionId,
  type AdminSectionId,
} from "@/lib/admin/nav";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";
import { OverviewSection } from "./sections/overview-section";
import { WritingSection } from "./sections/writing-section";
import { ListeningSection } from "./sections/listening-section";
import { SpeakingSection } from "./sections/speaking-section";
import { ComingSoonSection } from "./sections/coming-soon-section";

function AdminSectionContent({ section }: { section: AdminSectionId }) {
  switch (section) {
    case "overview":
      return <OverviewSection />;
    case "writing":
      return <WritingSection />;
    case "speaking":
      return <SpeakingSection />;
    case "listening":
      return <ListeningSection />;
    case "reading":
      return <ComingSoonSection skill="Reading" />;
    default:
      return <OverviewSection />;
  }
}

export function AdminShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const initialSection =
    sectionParam && isAdminSectionId(sectionParam) ? sectionParam : "overview";

  const [activeSection, setActiveSection] = useState<AdminSectionId>(initialSection);

  const handleSectionChange = useCallback(
    (section: AdminSectionId) => {
      setActiveSection(section);
      router.replace(`/admin/dashboard?section=${section}`, { scroll: false });
    },
    [router]
  );

  const navItem = getAdminNavItem(activeSection);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar title={navItem.label} description={navItem.description} />

        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <AdminSectionContent section={activeSection} />
        </main>
      </div>
    </div>
  );
}
