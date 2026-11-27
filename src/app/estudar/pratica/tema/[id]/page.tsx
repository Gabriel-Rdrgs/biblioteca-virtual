import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowRight, Box, Timer } from "lucide-react";
import { RichText } from "@/components/flashcards/rich-text";
import { PracticeFigure } from "@/components/pratica/practice-figure";
import { StudiedToggle } from "@/components/pratica/practice-progress";
import { Breadcrumbs } from "@/components/ui/primitives";
import { figureUrl, getPracticeTopic, practiceData, TOPIC_ATLAS } from "@/lib/data/pratica";
import { AREA_LABELS } from "@/lib/domain/practice";

export function generateStaticParams() {
  return practiceData.topics.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const topic = getPracticeTopic(id);
  return topic
    ? { title: `${topic.title} · Prova prática`, description: `O que cai na estação de ${topic.title.toLowerCase()}.` }
    : { title: "Tema não encontrado" };
}

/**
 * Um tema da prova prática, na ordem em que se estuda para a estação:
 * o esquema, as figuras dos livros (números com gabarito recolhido), a ficha
 * de cinco campos, o que o professor pode pedir, a resposta-modelo de 45 s,
 * as pegadinhas e a autorrevisão — e, na anatomia, o mesmo osso ou músculo
 * no corpo em 3D.
 */

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function TemaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = getPracticeTopic(id);
  if (!topic) notFound();

  const figures = Object.entries(practiceData.figures).filter(
    ([, f]) => f.topics.includes(topic.id) && !f.arrowOf,
  );
  const bank = practiceData.bank.filter((b) => b.topic === topic.id);
  const atlas = TOPIC_ATLAS[topic.id] ?? [];
  const i = practiceData.topics.findIndex((t) => t.id === topic.id);
  const next = practiceData.topics[(i + 1) % practiceData.topics.length];
  const five: [string, string][] = [
    ["Identificação", topic.five.identification],
    ["Localização e relações", topic.five.location],
    ["Função", topic.five.function],
    [topic.area === "anatomia" ? "Inervação" : "Origem embrionária", topic.five.origin],
    ["Aplicação clínica", topic.five.clinical],
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <Breadcrumbs
        trail={[
          { label: "Prova prática", href: "/estudar/pratica" },
          { label: topic.title },
        ]}
      />
      <p className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">
        {AREA_LABELS[topic.area]}
        {topic.region ? ` · ${topic.region}` : ""}
      </p>
      <h1 className="mt-1 text-3xl font-semibold">{topic.title}</h1>

      <Block title="Resumo esquemático">
        <div className="border-primary bg-surface-sunken rounded-xl border-l-4 p-4 text-sm leading-relaxed">
          <RichText text={topic.schema} />
        </div>
      </Block>

      {atlas.length ? (
        <Block title="No corpo em 3D">
          <div className="flex flex-wrap gap-2">
            {atlas.map((a) => (
              <Link
                key={a.id}
                href={`/anatomia/atlas?estrutura=${a.id}`}
                className="glass-strong inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium"
              >
                <Box className="size-4" aria-hidden="true" />
                {a.label}
              </Link>
            ))}
          </div>
        </Block>
      ) : null}

      {figures.length ? (
        <Block title="Figuras dos livros">
          <p className="text-ink-muted mb-3 text-sm">
            Identifique os números antes de abrir o gabarito. Toque na figura para ampliar.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {figures.map(([key, f]) => (
              <PracticeFigure
                key={key}
                figure={f}
                src={figureUrl(f.file)}
                points={f.points ? Object.keys(f.points) : undefined}
                pointLabels={!!f.points}
                showKey
                maxHeight="46vh"
              />
            ))}
          </div>
        </Block>
      ) : null}

      <Block title="Ficha de cinco campos">
        <dl className="grid gap-2 sm:grid-cols-2">
          {five.map(([label, text]) => (
            <div key={label} className="bg-surface-sunken rounded-xl p-3">
              <dt className="text-primary text-micro font-semibold tracking-[0.12em] uppercase">{label}</dt>
              <dd className="mt-1 text-sm leading-relaxed">
                <RichText text={text} />
              </dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block title="O que o professor pode pedir">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {topic.asks.map((a) => (
            <li key={a}>
              <RichText text={a} />
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Resposta-modelo (até 45 s)">
        <div className="border-ink rounded-xl border-2 p-4 text-sm leading-relaxed">
          <RichText text={topic.model} />
          <p className="bg-primary-soft text-primary mt-3 rounded-lg px-3 py-2 font-semibold">
            🔑 {topic.memo}
          </p>
        </div>
      </Block>

      <Block title="Pegadinhas frequentes">
        <ul className="border-danger bg-danger-soft space-y-1.5 rounded-xl border-l-4 p-4 text-sm">
          {topic.traps.map((t) => (
            <li key={t}>
              <RichText text={t} />
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Autorrevisão">
        <div className="space-y-2">
          {[...topic.review, ...bank.map((b) => ({ q: b.q, a: `${b.a}\n\n${b.why}\n\n**Pegadinha:** ${b.trap}` }))].map(
            (r, n) => (
              <details key={`${n}-${r.q}`} className="glass rounded-xl px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium">{r.q}</summary>
                <RichText text={r.a} className="text-ink-muted mt-2 text-sm" />
              </details>
            ),
          )}
        </div>
      </Block>

      <div className="mt-8 flex flex-wrap gap-2">
        <StudiedToggle topic={topic.id} />
        <Link
          href="/estudar/pratica/simulado"
          className="glass-strong inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold"
        >
          <Timer className="size-4" aria-hidden="true" /> Simulado
        </Link>
        {next ? (
          <Link
            href={`/estudar/pratica/tema/${next.id}`}
            className="text-ink-muted inline-flex min-h-11 items-center gap-1 px-2 text-sm font-medium"
          >
            Próximo tema: {next.title} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
