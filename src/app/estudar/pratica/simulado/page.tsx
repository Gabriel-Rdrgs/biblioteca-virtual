import type { Metadata } from "next";
import { PracticeExam } from "@/components/pratica/practice-exam";
import { Breadcrumbs } from "@/components/ui/primitives";
import { practiceData } from "@/lib/data/pratica";

export const metadata: Metadata = {
  title: "Simulado da prova prática · MAC I",
  description: "Dez estações cronometradas, leitura e resposta, com gabarito comentado e relatório por tema.",
};

export default function SimuladoPraticaPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="hidden sm:block">
        <Breadcrumbs
          trail={[
            { label: "Estudar", href: "/estudar" },
            { label: "Prova prática", href: "/estudar/pratica" },
            { label: "Simulado" },
          ]}
        />
      </div>
      <h1 className="mb-4 text-2xl font-semibold sm:text-3xl">Simulado da prova prática</h1>
      <PracticeExam
        data={{
          stations: practiceData.stations,
          figures: practiceData.figures,
          topics: practiceData.topics.map((t) => ({ id: t.id, title: t.title, trap: t.traps[0] ?? "" })),
        }}
      />
    </div>
  );
}
