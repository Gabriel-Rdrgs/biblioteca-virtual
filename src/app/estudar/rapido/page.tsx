import type { Metadata } from "next";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { QuickRunner } from "@/components/exam/quick-runner";
import { QuickSetup, type QuickArea } from "@/components/exam/quick-setup";
import { bankQuestions } from "@/lib/data/questions";
import { getDisciplines } from "@/lib/repository";
import { getQuestionAreas, pickQuickQuestions } from "@/lib/repository/exams";

export const metadata: Metadata = {
  title: "Modo rápido",
  description: "Uma objetiva por vez, com a correção e a explicação na hora.",
};
export const dynamic = "force-dynamic";

const list = (value?: string) => value?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

export default async function RapidoPage({
  searchParams,
}: {
  searchParams: Promise<{ areas?: string; eixos?: string; n?: string; questoes?: string; origem?: string }>;
}) {
  const params = await searchParams;
  const areaIds = list(params.areas);
  const axisIds = list(params.eixos);
  const ids = list(params.questoes).slice(0, 200);
  const running = areaIds.length > 0 || axisIds.length > 0 || ids.length > 0;
  const fromQueue = params.origem === "erros";

  const trail = [
    { label: "Início", href: "/" },
    { label: "Estudar", href: "/estudar" },
    { label: "Modo rápido", ...(running ? { href: "/estudar/rapido" } : {}) },
  ];

  if (running) {
    const count = ids.length > 0 ? ids.length : Math.min(Math.max(Number(params.n) || 20, 1), 100);
    const pick = pickQuickQuestions({
      ...(areaIds.length ? { areaIds } : {}),
      ...(axisIds.length ? { axisIds } : {}),
      ...(ids.length ? { ids } : {}),
      count,
    });
    const title = fromQueue
      ? "Fila de erros"
      : ids.length
        ? "Refazendo as erradas"
        : `Modo rápido · ${pick.areas.map((a) => a.shortLabel).join(", ") || "banco"}`;

    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Breadcrumbs trail={trail} />
        <QuickRunner
          // Uma rodada nova a cada navegação, mesmo com o mesmo endereço
          // ("refazer as erradas" duas vezes seguidas).
          key={Date.now()}
          questions={pick.questions}
          areas={pick.areas}
          figures={pick.figures}
          title={title}
          fromQueue={fromQueue}
        />
      </div>
    );
  }

  const disciplines = await getDisciplines();
  const disciplineName = new Map(disciplines.map((d) => [d.id, d.shortName]));
  const areas: QuickArea[] = getQuestionAreas()
    .map((area) => {
      const objective = bankQuestions.filter((q) => q.areaId === area.id && q.kind === "objetiva");
      return {
        id: area.id,
        label: area.label,
        discipline: disciplineName.get(area.disciplineId) ?? area.disciplineId,
        objetivas: objective.length,
        axes: area.axes.map((axis) => ({
          id: axis.id,
          label: axis.label,
          count: objective.filter((q) => q.axisId === axis.id).length,
        })),
      };
    })
    .filter((area) => area.objetivas > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs trail={trail} />
      <SectionHeading
        as="h1"
        title="Modo rápido"
        description="Uma objetiva por vez, corrigida assim que você responde, com o comentário do gabarito. O que você errar vai para a fila de erros. Teclado: 1–4 escolhem, Enter segue."
      />
      <QuickSetup areas={areas} />
    </div>
  );
}
