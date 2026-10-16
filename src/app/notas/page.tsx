import type { Metadata } from "next";
import { GradeBoard } from "@/components/grades/grade-board";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { getDisciplines } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Minhas notas",
  description: "As notas que você anotou, a média parcial e quanto falta para fechar.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

/**
 * A conta que todo mundo faz no papel, feita aqui.
 *
 * O servidor só entrega os nomes das disciplinas: as notas vivem no
 * aparelho de quem anotou, e as fórmulas vêm dos planos de ensino.
 */
export default async function NotasPage() {
  const disciplines = await getDisciplines();
  const nomes = Object.fromEntries(disciplines.map((d) => [d.id, d.name]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Minhas notas" }]} />
      <SectionHeading
        as="h1"
        title="Minhas notas"
        description="Anote o que tirou em cada avaliação e veja onde está: a média parcial, quanto falta na outra bimestral e se a ARA entra na conta. As fórmulas são as dos planos de ensino."
      />
      <GradeBoard nomes={nomes} />
    </div>
  );
}
