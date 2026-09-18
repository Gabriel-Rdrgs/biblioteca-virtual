import type { Metadata } from "next";
import { DisciplineCard } from "@/components/discipline/discipline-card";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { getDisciplineBookCounts, getDisciplines } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Disciplinas",
  description:
    "As sete unidades curriculares do 1º período de Medicina do UNIEURO em 2026.2, com ementa, conteúdos e bibliografia.",
};

export default function DisciplinesPage() {
  const disciplines = getDisciplines();
  const counts = getDisciplineBookCounts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Disciplinas" }]} />
      <SectionHeading
        as="h1"
        title="Disciplinas"
        description="As sete unidades curriculares do 1º período em 2026.2. Cada uma traz a ementa oficial, os conteúdos por unidade, a bibliografia separada por tipo e o plano de ensino completo."
      />

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {disciplines.map((discipline) => (
          <li key={discipline.id} className="flex">
            <DisciplineCard
              discipline={discipline}
              bookCount={counts.get(discipline.id) ?? 0}
              className="w-full"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
