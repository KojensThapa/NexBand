"use client";

import { useCallback, useRef } from "react";
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
import { ReadingSection } from "./sections/reading-section";
import { AdminProfileSection } from "./sections/profile-section";

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
      return <ReadingSection />;
    case "profile":
      return <AdminProfileSection />;
    default:
      return <OverviewSection />;
  }
}

export function AdminShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const activeSection =
    sectionParam && isAdminSectionId(sectionParam) ? sectionParam : "overview";
  // Remembers which section was active before the profile panel was opened,
  // so clicking the profile button again ("closing" it) returns you there.
  const previousSection = useRef<AdminSectionId>("overview");

  const handleSectionChange = useCallback(
    (section: AdminSectionId) => {
      let nextSection = section;

      if (section === "profile") {
        if (activeSection === "profile") {
          // Profile is already open -> treat this click as "close" and go back.
          nextSection = previousSection.current;
        } else {
          // Opening profile -> remember where we came from.
          previousSection.current = activeSection;
        }
      }

      router.replace(`/admin/dashboard?section=${nextSection}`, { scroll: false });
    },
    [activeSection, router]
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
