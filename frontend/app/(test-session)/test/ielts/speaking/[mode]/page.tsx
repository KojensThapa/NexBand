import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ mode: string }>;
}

export default async function SpeakingModePage({ params }: PageProps) {
  await params;

  redirect("/test/ielts/speaking");
}
