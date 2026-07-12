"use client";

import { useEffect, useState } from "react";
import { ListeningSession } from "@/components/test/listening/listening-session";
import { getListeningMockTest } from "@/lib/exams/ielts-listening";
import { buildAdminListeningMockTests } from "@/lib/admin/listening-to-exam";
import { getAdminListeningTests } from "@/lib/admin/listening-storage";
import type { ListeningMockTest, ListeningPartNumber } from "@/types/listening";

interface ListeningMockPageClientProps {
  testId: string;
  initialPart?: ListeningPartNumber;
  backHref?: string;
}

export function ListeningMockPageClient({
  testId,
  initialPart,
  backHref = "/test/ielts/listening",
}: ListeningMockPageClientProps) {
  const [mockTest, setMockTest] = useState<ListeningMockTest | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (testId.startsWith("admin-listening-")) {
      const adminTests = getAdminListeningTests();
      const adminMocks = buildAdminListeningMockTests(adminTests, { publishedOnly: true });
      const match = adminMocks.find((test) => test.id === testId);
      if (match) {
        setMockTest(match);
        setNotFound(false);
        return;
      }
      setNotFound(true);
      return;
    }

    const staticTest = getListeningMockTest(testId);
    if (staticTest.id === testId) {
      setMockTest(staticTest);
      setNotFound(false);
      return;
    }

    setNotFound(true);
  }, [testId]);

  if (notFound) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-medium text-slate-900">Listening test not found</p>
        <p className="text-sm text-slate-500">
          This test may have been removed or is not published yet.
        </p>
      </div>
    );
  }

  if (!mockTest) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading listening test…
      </div>
    );
  }

  return (
    <ListeningSession
      mockTest={mockTest}
      initialPart={initialPart}
      backHref={backHref}
    />
  );
}
