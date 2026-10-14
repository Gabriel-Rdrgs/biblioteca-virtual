import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, PlayCircle } from "lucide-react";
import { Badge, Breadcrumbs, ButtonAnchor, ButtonLink } from "@/components/ui/primitives";
import { loadExamBySlug } from "@/lib/repository/exams";
import { getDisciplines } from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const loaded = loadExamBySlug(slug);
  if (!loaded) notFound();
  return { title: loaded.exam.title, description: loaded.exam.description };
}

export default async function SimuladoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = loadExamBySlug(slug);
  if (!loaded) notFound();

  const { exam } = loaded;
  const discipline = (await getDisciplines()).find((d) => d.id === exam.disciplineId);
  const discursivas = loaded.questions.filter((p) => p.question.kind === "discursiva").length;
  const objetivas = loaded.questions.length - discursivas;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Simulados", href: "/simulados" },
          { label: exam.title },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tom="primario">{exam.assessment}</Badge>
        {discipline ? (
          <Link
            href={`/disciplinas/${discipline.slug}`}
            className="text-ink-muted hover:text-primary text-sm"
          >
            {discipline.name}
          </Link>
        ) : null}
        <span className="text-ink-faint text-sm">· {exam.semester}</span>
      </div>

      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{exam.title}</h1>
      <p className="text-ink-muted mt-3 text-lg leading-relaxed text-pretty">{exam.description}</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [String(loaded.questions.length), "questões"],
          [String(discursivas), "discursivas"],
          [String(objetivas), "objetivas"],
          [String(loaded.axes.length), "eixos"],
        ].map(([value, label]) => (
          <div key={label} className="glass rounded-panel p-4">
            <p className="font-display text-primary text-3xl font-semibold tabular-nums">{value}</p>
            <p className="text-ink-muted mt-0.5 text-sm">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={`/simulados/${exam.slug}/fazer`} size="lg">
          <PlayCircle className="size-4" aria-hidden="true" />
          Fazer na tela
        </ButtonLink>
        {exam.pdfPath ? (
          <ButtonAnchor
            href={`/api/simulados/${exam.pdfPath}?baixar=1`}
            variant="secundario"
            size="lg"
          >
            <FileText className="size-4" aria-hidden="true" />
            Baixar para imprimir
          </ButtonAnchor>
        ) : null}
      </div>

      {exam.instructions.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Como fazer</h2>
          <ol className="mt-3 space-y-2">
            {exam.instructions.map((line, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="font-display text-ink-faint w-4 shrink-0 text-right">{i + 1}</span>
                <span className="text-ink-muted">{line}</span>
              </li>
            ))}
          </ol>
          {exam.note ? (
            <p className="glass text-ink-muted rounded-panel mt-4 p-4 text-sm leading-relaxed">
              {exam.note}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-lg font-semibold">O que cai</h2>
        <ul className="mt-3 space-y-2">
          {loaded.axes.map((axis) => {
            const count = loaded.questions.filter((p) => p.question.axisId === axis.id).length;
            return (
              <li
                key={axis.id}
                className="border-line/60 flex flex-wrap items-baseline justify-between gap-2 border-b py-2.5 text-sm"
              >
                <span className="font-medium">{axis.label}</span>
                <span className="text-ink-faint tabular-nums">
                  {count} {count === 1 ? "questão" : "questões"}
                  {axis.group ? ` · ${axis.group}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-ink-faint mt-12 text-xs leading-relaxed">
        {loaded.areas.map((area) => area.sourceNote).join(" ")} Material autoral de treino,
        inspirado no formato da avaliação. Não é avaliação institucional.
      </p>
    </div>
  );
}
