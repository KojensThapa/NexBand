import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    mode: string;
  }>;
}

export default async function WritingModePage({ params }: PageProps) {
  await params;

  redirect("/test/ielts/writing");
}
