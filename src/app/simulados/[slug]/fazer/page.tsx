import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExamRunner } from "@/components/exam/exam-runner";
import { loadExamBySlug } from "@/lib/repository/exams";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const loaded = loadExamBySlug(slug);
  if (!loaded) notFound();
  return { title: `${loaded.exam.title} — fazendo`, robots: { index: false } };
}

export default async function FazerSimuladoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = loadExamBySlug(slug);
  if (!loaded) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <ExamRunner loaded={loaded} />
    </div>
  );
}
