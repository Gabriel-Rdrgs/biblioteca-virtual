import type { Metadata } from "next";
import { AnatomyHome } from "@/components/anatomia/anatomy-home";
import { StudyToday } from "@/components/anatomia/study-today";
import { Breadcrumbs } from "@/components/ui/primitives";
import { allTrainableMuscles, anatomyData, anatomyLessons } from "@/lib/data/anatomia";

export const metadata: Metadata = {
  title: "Lições de anatomia",
  description:
    "O músculo ou osso acende no corpo em 3D e você escreve o nome: três rodadas por lição, com revisão espaçada.",
};

export default function LicoesPage() {
  const trainable = allTrainableMuscles();
  return (
    <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6">
      <Breadcrumbs
        trail={[
          { label: "Atlas de anatomia", href: "/anatomia" },
          { label: "Lições" },
        ]}
      />
      <header className="mb-6 space-y-3">
        <h1 className="text-3xl font-semibold">Lições</h1>
        <p className="text-ink-muted text-sm leading-relaxed sm:text-base">
          A estrutura acende no corpo e você escreve o nome — primeiro vendo, depois só com a
          primeira letra, por fim de memória, olhando o outro lado. O que você acerta volta em 1, 3,
          7, 14 e 30 dias.
        </p>
        <StudyToday
          lessons={anatomyLessons.map(({ id, title }) => ({ id, title }))}
          trainable={trainable.map((m) => m.id)}
        />
      </header>
      <AnatomyHome
        regions={anatomyData.regions}
        lessons={anatomyLessons}
        muscles={trainable.map(({ id, namePt, region }) => ({ id, namePt, region }))}
      />
    </div>
  );
}
