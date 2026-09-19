import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { BookCover } from "@/components/book/book-cover";
import { BookGrid } from "@/components/book/book-grid";
import { DisciplineCard } from "@/components/discipline/discipline-card";
import { SectionHeading } from "@/components/ui/primitives";
import { isAdminRequest } from "@/lib/audience";
import {
  getCatalog,
  getMostAccessed,
  getDisciplineBookCounts,
  getDisciplines,
  getRecentlyAdded,
  getSharedBooks,
  getStats,
  toCatalogEntries,
} from "@/lib/repository";

// The catalogue is edited at runtime by the admin area; render per request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const admin = await isAdminRequest();
  const [stats, counts, shared, catalog, core, recent] = await Promise.all([
    getStats(),
    getDisciplineBookCounts(),
    getSharedBooks(),
    getCatalog(),
    getMostAccessed(10),
    getRecentlyAdded(5),
  ]);
  const disciplines = getDisciplines();

  // Five real covers for the shelf — the books the class actually opens.
  const shelf = toCatalogEntries(catalog.filter((entry) => entry.book.file).slice(0, 5), {
    admin,
  });
  const mostUsed = toCatalogEntries(core, { admin });
  const latest = toCatalogEntries(recent, { admin });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* ---------------------------------------------------------- hero */}
      <section className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-24">
        <div>
          <p className="text-ink-muted text-sm font-medium">
            Medicina · 1º período · UNIEURO · 2026.2
          </p>
          <h1 className="mt-4 text-[2.75rem] leading-[1.02] font-semibold sm:text-6xl lg:text-[4.25rem]">
            A estante da nossa turma.
          </h1>
          <p className="text-ink-muted mt-5 max-w-lg text-lg leading-relaxed text-pretty">
            {stats.withFile} livros do semestre em PDF, prontos para abrir no celular. Sem cadastro,
            sem enrolação — só a senha da turma.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/livros"
              className="bg-primary text-on-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-[var(--shadow-raise)] transition-colors"
            >
              Abrir a estante
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/disciplinas"
              className="glass hover:glass-strong inline-flex items-center rounded-full px-5 py-3 text-sm font-medium transition-colors"
            >
              Ver por matéria
            </Link>
          </div>

          <form action="/busca" className="mt-6 flex max-w-md items-center">
            <label htmlFor="hero-search" className="sr-only">
              Buscar na estante
            </label>
            <div className="glass relative w-full rounded-full">
              <Search
                className="text-ink-faint pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="hero-search"
                name="q"
                type="search"
                placeholder="Procurar um livro, autor ou tema…"
                className="placeholder:text-ink-faint w-full rounded-full bg-transparent py-3 pr-4 pl-11 text-sm outline-none"
              />
            </div>
          </form>
        </div>

        {/* A fanned shelf of real covers. */}
        <div
          className="relative mx-auto h-[19rem] w-full max-w-lg sm:h-[22rem] lg:h-[26rem]"
          aria-hidden="true"
        >
          <div className="glass absolute inset-x-6 bottom-0 h-3 rounded-full" />
          {shelf.map((entry, i) => {
            const n = shelf.length;
            const offset = i - (n - 1) / 2;
            return (
              <div
                key={entry.book.id}
                className="absolute bottom-3 w-[34%] transition-transform duration-300 hover:-translate-y-3 motion-reduce:transform-none sm:w-[32%]"
                style={{
                  left: `${50 + offset * 19}%`,
                  transform: `translateX(-50%) rotate(${offset * 5}deg)`,
                  zIndex: n - Math.abs(Math.round(offset)),
                }}
              >
                <BookCover book={entry.book} size="md" decorative />
              </div>
            );
          })}
        </div>
      </section>

      {/* --------------------------------------------------- mais usados */}
      <section className="py-12">
        <SectionHeading
          title="Mais acessados"
          description="Os livros que a turma mais abre. Enquanto a contagem é nova, entram primeiro os da bibliografia básica."
          action={
            <Link
              href="/livros"
              className="text-primary inline-flex shrink-0 items-center gap-1.5 text-sm font-medium hover:underline"
            >
              Ver tudo
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />
        <BookGrid entries={mostUsed} label="Mais acessados" />
      </section>

      {/* --------------------------------------------------- disciplinas */}
      <section className="py-12">
        <SectionHeading
          title="Por matéria"
          description="Ementa, conteúdos, livros e o plano de ensino de cada uma."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>

      {/* ------------------------------------------- compartilhados + novos */}
      <section className="grid gap-10 py-12 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
        <div>
          <SectionHeading
            title="Vale para mais de uma matéria"
            description="Um livro só, várias disciplinas."
          />
          <ul className="space-y-3">
            {shared.slice(0, 4).map((entry) => (
              <li key={entry.book.id} className="glass rounded-2xl p-4">
                <Link
                  href={`/livros/${entry.book.slug}`}
                  className="hover:text-primary leading-snug font-semibold"
                >
                  {entry.book.title}
                </Link>
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {entry.links.map((link) => (
                    <li
                      key={link.disciplineId}
                      className="text-ink-muted flex items-center gap-1.5 text-sm"
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: link.discipline.color }}
                        aria-hidden="true"
                      />
                      {link.discipline.shortName}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionHeading
            title="Chegou agora"
            description="Os últimos PDFs adicionados à estante."
          />
          <BookGrid
            entries={latest}
            label="Adicionados recentemente"
            className="grid-cols-3 sm:grid-cols-5 lg:grid-cols-5"
          />
        </div>
      </section>

      {/* -------------------------------------------------------- rodapé */}
      <section className="pt-6 pb-16">
        <div className="glass rounded-3xl p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="font-display text-primary text-4xl font-semibold tabular-nums">
                {stats.withFile}
              </p>
              <p className="mt-1 text-sm font-medium">livros em PDF</p>
            </div>
            <div>
              <p className="font-display text-primary text-4xl font-semibold tabular-nums">
                {stats.disciplines}
              </p>
              <p className="mt-1 text-sm font-medium">matérias do semestre</p>
            </div>
            <div>
              <p className="font-display text-primary text-4xl font-semibold tabular-nums">
                {stats.teachingPlans}
              </p>
              <p className="mt-1 text-sm font-medium">planos de ensino</p>
            </div>
          </div>
          <p className="text-ink-muted mt-6 max-w-2xl text-sm leading-relaxed text-pretty">
            Isto aqui é da turma, para a turma. Os PDFs são de uso interno — não repasse fora do
            grupo.{" "}
            <Link href="/uso-responsavel" className="text-primary hover:underline">
              Combinados de uso
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
