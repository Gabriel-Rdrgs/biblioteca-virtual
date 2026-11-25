import type { Metadata } from "next";
import { LessonsBoard } from "@/components/anatomia/lessons-board";
import { StudyToday } from "@/components/anatomia/study-today";
import { Breadcrumbs } from "@/components/ui/primitives";
import { allTrainableMuscles, anatomyData, anatomyLessons } from "@/lib/data/anatomia";

export const metadata: Metadata = {
  title: "Lições de anatomia",
  description:
    "Ossos, acidentes ósseos e músculos, região por região: a estrutura acende no corpo em 3D e você escreve o nome.",
};

export default function LicoesPage() {
  const trainable = allTrainableMuscles();
  const names = Object.fromEntries(trainable.map((m) => [m.id, m.namePt]));
  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <Breadcrumbs
        trail={[
          { label: "Atlas de anatomia", href: "/anatomia" },
          { label: "Lições" },
        ]}
      />
      <header className="mb-5 space-y-3">
        <h1 className="text-3xl font-semibold">Lições</h1>
        <p className="text-ink-muted text-sm leading-relaxed sm:text-base">
          Cada região do corpo, na ordem de um atlas: ossos, acidentes ósseos, músculos superficiais
          e profundos. A estrutura acende e você escreve o nome — vendo, só com a primeira letra, de
          memória. O que acerta volta em 1, 3, 7, 14 e 30 dias.
        </p>
        <StudyToday
          lessons={anatomyLessons.map(({ id, title }) => ({ id, title }))}
          trainable={trainable.map((m) => m.id)}
        />
      </header>
      <LessonsBoard
        regions={anatomyData.regions.map(({ id, name }) => ({ id, name }))}
        lessons={anatomyLessons}
        names={names}
      />
    </div>
  );
}
