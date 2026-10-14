import type { Metadata } from "next";
import { ExamRunner } from "@/components/exam/exam-runner";
import { buildDrill, getQuestionAreas } from "@/lib/repository/exams";
import type { ExamBlueprintPart } from "@/lib/domain/exam-types";
import { ButtonLink } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Treino", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * A simulado composed on the spot: `partes` says how many discursivas and
 * objetivas to take from each área, and `questoes` narrows the draw to a
 * given set — which is how "refazer as que errei" is served.
 */
export default async function TreinoPage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string; partes?: string; questoes?: string }>;
}) {
  const { materia, partes, questoes } = await searchParams;
  const areas = getQuestionAreas(materia);

  const onlyIds = questoes?.split(",").filter(Boolean);

  const parts: ExamBlueprintPart[] = (partes?.split(",") ?? [])
    .map((part) => part.split(":"))
    .flatMap(([areaId, d, o]) =>
      areaId && areas.some((area) => area.id === areaId)
        ? [{ areaId, discursivas: Number(d) || 0, objetivas: Number(o) || 0 }]
        : [],
    );

  // Redoing a set of questions needs no counts: take everything allowed.
  const effective: ExamBlueprintPart[] =
    parts.length > 0
      ? parts
      : onlyIds
        ? areas.map((area) => ({ areaId: area.id, discursivas: 20, objetivas: 60 }))
        : [];

  if (effective.length === 0 || !materia) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Monte o treino primeiro</h1>
        <p className="text-ink-muted mt-3 leading-relaxed">
          Escolha a matéria, as áreas e quantas questões você quer.
        </p>
        <ButtonLink href="/estudar" className="mt-6">
          Ir para Estudar
        </ButtonLink>
      </div>
    );
  }

  const loaded = buildDrill(materia, {
    parts: effective,
    title: onlyIds ? "Refazendo o que errei" : "Treino",
    ...(onlyIds ? { onlyIds } : {}),
  });

  if (loaded.questions.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Nenhuma questão encontrada</h1>
        <p className="text-ink-muted mt-3 leading-relaxed">
          O banco dessa matéria ainda não tem questões para esse filtro.
        </p>
        <ButtonLink href="/estudar" className="mt-6">
          Voltar para Estudar
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <ExamRunner loaded={loaded} />
    </div>
  );
}
