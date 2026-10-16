import type { Metadata } from "next";
import Link from "next/link";
import { GradePanel, type GradeDiscipline } from "@/components/grades/grade-panel";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { getDisciplines } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Minhas notas",
  description: "As notas que você anotou, a média parcial e quanto falta para fechar.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

/**
 * As sete matérias em notas, lado a lado.
 *
 * Esta página não é mais onde a nota se digita — isso virou um pop-up, que
 * abre também da matéria e do cartão da prova no calendário. O que ela faz é
 * o que nenhuma outra tela faz: as sete juntas, para comparar e ver qual
 * está perto da ARA.
 *
 * O servidor só entrega os nomes das disciplinas: as notas vivem no aparelho
 * de quem anotou, e as fórmulas vêm dos planos de ensino.
 */
export default async function NotasPage() {
  const disciplines = await getDisciplines();
  const disciplinas: GradeDiscipline[] = disciplines.map((d) => ({
    id: d.id,
    name: d.name,
    shortName: d.shortName,
    color: d.color,
    slug: d.slug,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Minhas notas" }]} />
      <SectionHeading
        as="h1"
        title="Minhas notas"
        description="O semestre inteiro de uma vez: a nota de cada bimestral, a média parcial e quanto falta na outra para fechar 6,0. Toque em uma matéria para anotar."
      />

      <GradePanel disciplinas={disciplinas} />

      <p className="text-ink-faint mt-10 text-xs leading-relaxed">
        A mesma folha de notas abre da página de cada matéria e do cartão da prova no{" "}
        <Link href="/calendario" className="hover:text-ink underline">
          calendário
        </Link>
        , onde a aba Notas mostra este mesmo painel.
      </p>
    </div>
  );
}
