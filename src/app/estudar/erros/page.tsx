import type { Metadata } from "next";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { ErrorQueueView } from "@/components/exam/error-queue-view";
import { getDisciplines } from "@/lib/repository";
import { getQuestionAreas } from "@/lib/repository/exams";

export const metadata: Metadata = {
  title: "Fila de erros",
  description: "As objetivas que você errou, até acertar duas vezes seguidas.",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function ErrosPage() {
  const disciplines = await getDisciplines();
  const name = new Map(disciplines.map((d) => [d.id, d.shortName]));
  const areas = getQuestionAreas().map((area) => ({
    id: area.id,
    label: area.label,
    discipline: name.get(area.disciplineId) ?? area.disciplineId,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Estudar", href: "/estudar" },
          { label: "Fila de erros" },
        ]}
      />
      <SectionHeading
        as="h1"
        title="Fila de erros"
        description="Toda objetiva que você errou — no modo rápido ou num simulado corrigido — fica aqui. Acertar uma vez logo depois do gabarito é memória curta; ela só sai com dois acertos seguidos."
      />
      <ErrorQueueView areas={areas} />
    </div>
  );
}
