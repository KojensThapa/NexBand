import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    mode: string;
  }>;
}

export default async function ReadingModePage({ params }: PageProps) {
  await params;

  redirect("/test/ielts/reading");
}
