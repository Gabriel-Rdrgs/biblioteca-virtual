import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Timer } from "lucide-react";
import { PracticeHistory, StudiedCount, StudiedMark } from "@/components/pratica/practice-progress";
import { RichText } from "@/components/flashcards/rich-text";
import { Breadcrumbs } from "@/components/ui/primitives";
import { practiceData } from "@/lib/data/pratica";
import { AREA_LABELS, type PracticeArea } from "@/lib/domain/practice";

export const metadata: Metadata = {
  title: "Prova prática · MAC I",
  description:
    "Simulado cronometrado da prova prática de MAC I (N2): estações de anatomia, embriologia e histologia, com gabarito comentado.",
};

/**
 * A prova prática de MAC I (N2): o caso clínico que amarra tudo, o simulado
 * cronometrado, os temas para estudar e as cadeias de raciocínio do caso.
 */

const ORDER: readonly PracticeArea[] = ["anatomia", "embriologia", "histologia"];

export default function PraticaPage() {
  const { topics, stations, bank, chains } = practiceData;
  return (
    <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="hidden sm:block">
        <Breadcrumbs trail={[{ label: "Estudar", href: "/estudar" }, { label: "Prova prática" }]} />
      </div>

      <header className="space-y-3">
        <p className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">
          MAC I · N2 prática
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Prova prática</h1>
        <p className="text-ink-muted text-sm leading-relaxed sm:text-base">
          Estações de Anatomia, Embriologia e Histologia com peças do Netter, esquemas do Moore,
          lâminas do Gartner e o modelo do laboratório — tudo amarrado no caso da prova.
        </p>
        <Link
          href="/estudar/pratica/simulado"
          className="bg-primary text-on-primary flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3"
        >
          <Timer className="size-6 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Fazer o simulado</span>
            <span className="block text-sm opacity-85">
              10 estações · 2 questões cada · leitura + resposta cronometradas
            </span>
          </span>
          <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
        </Link>
        <p className="text-ink-faint text-xs">
          {stations.length} estações no banco do simulado · {topics.length} temas · {bank.length}{" "}
          perguntas de revisão
        </p>
      </header>

      <section aria-labelledby="caso" className="mt-8">
        <h2 id="caso" className="mb-2 text-lg font-semibold">
          O caso em 30 segundos
        </h2>
        <ul className="glass space-y-1.5 rounded-2xl p-4 text-sm leading-relaxed">
          {practiceData.case.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-primary" aria-hidden="true">
                •
              </span>
              <RichText text={line} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="temas" className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 id="temas" className="text-lg font-semibold">
            Temas
          </h2>
          <span className="text-ink-faint text-xs">
            estudados <StudiedCount total={topics.length} />
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {ORDER.map((area) => (
            <div key={area} className="glass rounded-2xl p-3">
              <p className="text-ink-faint text-micro px-2 pt-1 font-semibold tracking-[0.12em] uppercase">
                {AREA_LABELS[area]}
              </p>
              <ul className="mt-1">
                {topics
                  .filter((t) => t.area === area)
                  .map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/estudar/pratica/tema/${t.id}`}
                        className="hover:bg-surface-sunken flex min-h-11 items-center gap-2 rounded-xl px-2 py-2 text-sm"
                      >
                        <span className="min-w-0 flex-1">{t.title}</span>
                        <StudiedMark topic={t.id} />
                        <ChevronRight className="text-ink-faint size-4 shrink-0" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="mapa" className="mt-8">
        <h2 id="mapa" className="mb-1 text-lg font-semibold">
          Mapa mental do caso
        </h2>
        <p className="text-ink-muted mb-3 text-sm">As cadeias de raciocínio que a prova cobra.</p>
        <div className="space-y-3">
          {chains.map((c) => (
            <details key={c.title} className="glass group rounded-2xl">
              <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3 font-medium">
                <span className="min-w-0 flex-1">{c.title}</span>
                <span className="text-ink-faint text-xs">{AREA_LABELS[c.area]}</span>
                <ChevronRight
                  className="text-ink-faint size-4 shrink-0 transition-transform group-open:rotate-90"
                  aria-hidden="true"
                />
              </summary>
              <ol className="space-y-2 px-4 pb-4">
                {c.steps.map((s, i) => (
                  <li key={`${s.name}-${i}`} className="border-primary/40 border-l-2 pl-3">
                    <p className="text-sm font-semibold">
                      {i + 1}. {s.name}
                    </p>
                    <RichText text={s.text} className="text-ink-muted text-sm" />
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-8">
        <PracticeHistory />
      </div>
    </div>
  );
}
