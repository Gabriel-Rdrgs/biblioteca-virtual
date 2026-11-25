import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NameTrainer } from "@/components/anatomia/name-trainer";
import { anatomyLessons, getLesson, nextLesson, trainableMuscle } from "@/lib/data/anatomia";

export function generateStaticParams() {
  return anatomyLessons.map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lesson = getLesson(id);
  return lesson
    ? { title: `Lição · ${lesson.title}`, description: "Três rodadas pelos mesmos nomes, até escrever de memória." }
    : { title: "Lição não encontrada" };
}

export default async function LicaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();
  const muscles = lesson.itemIds.flatMap((m) => {
    const muscle = trainableMuscle(m);
    return muscle ? [muscle] : [];
  });
  if (muscles.length === 0) notFound();
  const next = nextLesson(lesson.id);

  return (
    <>
      <h1 className="sr-only">Lição · {lesson.title}</h1>
      <NameTrainer
        mode="licao"
        title={lesson.title}
        lesson={{ id: lesson.id, title: lesson.title }}
        muscles={muscles}
        nextLesson={next ? { href: `/anatomia/licao/${next.id}`, title: next.title } : null}
        exitHref="/anatomia/licoes"
      />
    </>
  );
}
