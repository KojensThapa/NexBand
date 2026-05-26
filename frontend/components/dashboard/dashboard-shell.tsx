"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getNavItem,
  isDashboardSectionId,
  type DashboardSectionId,
} from "@/lib/dashboard/nav";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";
import { HomeSection } from "./sections/home-section";
import { ReportsSection } from "./sections/reports-section";
import { SkillSection } from "./sections/skill-section";
import { SampleReportsSection } from "./sections/sample-reports-section";
import { LessonsSection } from "./sections/lessons-section";

function DashboardSectionContent({ section }: { section: DashboardSectionId }) {
  switch (section) {
    case "home":
      return <HomeSection />;
    case "reports":
      return <ReportsSection />;
    case "writing":
    case "speaking":
    case "listening":
    case "reading":
      return <SkillSection sectionId={section} />;
    case "sample-reports":
      return <SampleReportsSection />;
    case "lessons":
      return <LessonsSection />;
    default:
      return <HomeSection />;
  }
}

export function DashboardShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const initialSection =
    sectionParam && isDashboardSectionId(sectionParam) ? sectionParam : "home";

  const [activeSection, setActiveSection] =
    useState<DashboardSectionId>(initialSection);

  const handleSectionChange = useCallback(
    (section: DashboardSectionId) => {
      setActiveSection(section);
      router.replace(`/dashboard?section=${section}`, { scroll: false });
    },
    [router]
  );

  const navItem = getNavItem(activeSection);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          title={navItem.label}
          description={navItem.description}
        />

        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <DashboardSectionContent section={activeSection} />
        </main>
      </div>
    </div>
  );
}
