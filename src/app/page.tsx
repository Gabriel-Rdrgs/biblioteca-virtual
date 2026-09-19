import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { BookGrid } from "@/components/book/book-grid";
import { DisciplineCard } from "@/components/discipline/discipline-card";
import { SectionHeading } from "@/components/ui/primitives";
import { BibliographyBadge } from "@/components/book/book-badge";
import {
  getCoreBibliography,
  getDisciplineBookCounts,
  getDisciplines,
  getRecentlyAdded,
  getSharedBooks,
  getStats,
  toCatalogEntries,
} from "@/lib/repository";

const shortcuts = [
  { href: "/livros", label: "Todos os livros", description: "o catálogo inteiro, com filtros" },
  { href: "/disciplinas", label: "Disciplinas", description: "as sete unidades curriculares" },
  { href: "/planos-de-ensino", label: "Planos de ensino", description: "os documentos oficiais" },
] as const;

// The catalogue is edited at runtime by the admin area; render per request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stats = await getStats();
  const disciplines = getDisciplines();
  const counts = await getDisciplineBookCounts();
  const shared = await getSharedBooks();
  const core = toCatalogEntries((await getCoreBibliography()).slice(0, 10));
  const recent = toCatalogEntries(await getRecentlyAdded(5));

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="border-line bg-canvas-deep relative overflow-hidden border-b">
        <div
          className="texture-contour pointer-events-none absolute inset-0 opacity-70"
          aria-hidden="true"
        />
        <div
          className="texture-paper pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-ink-faint text-xs font-medium tracking-[0.22em] uppercase">
            Medicina · 1º período · UNIEURO · 2026.2
          </p>

          <h1 className="mt-5 max-w-4xl text-[2.6rem] leading-[1.04] font-semibold sm:text-6xl lg:text-7xl">
            Toda a bibliografia do semestre, em um só lugar.
          </h1>

          <p className="text-ink-muted mt-6 max-w-2xl text-lg leading-relaxed text-pretty">
            {stats.books} títulos lidos diretamente dos {stats.teachingPlans} planos de ensino
            oficiais. Cada livro sabe em quais disciplinas é usado e de qual página do plano ele
            veio.
          </p>

          <form action="/busca" className="mt-9 flex max-w-xl items-center gap-2">
            <label htmlFor="hero-search" className="sr-only">
              Buscar no acervo
            </label>
            <div className="relative flex-1">
              <Search
                className="text-ink-faint pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="hero-search"
                name="q"
                type="search"
                placeholder="Bates, anamnese, saúde coletiva…"
                className="border-line bg-surface placeholder:text-ink-faint focus:border-primary w-full rounded-lg border py-3.5 pr-4 pl-12 text-base shadow-[var(--shadow-raise)]"
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-on-primary hover:bg-primary-hover shrink-0 rounded-lg px-6 py-3.5 text-sm font-medium transition-colors"
            >
              Buscar
            </button>
          </form>

          <ul className="border-line mt-12 flex flex-col divide-y divide-[var(--line)] border-y sm:flex-row sm:divide-x sm:divide-y-0">
            {shortcuts.map((shortcut) => (
              <li key={shortcut.href} className="flex-1">
                <Link
                  href={shortcut.href}
                  className="group hover:bg-surface/60 flex items-baseline justify-between gap-4 px-1 py-4 transition-colors sm:px-5"
                >
                  <span>
                    <span className="font-display block text-lg font-semibold">
                      {shortcut.label}
                    </span>
                    <span className="text-ink-faint block text-sm">{shortcut.description}</span>
                  </span>
                  <ArrowRight
                    className="text-ink-faint group-hover:text-primary size-4 shrink-0 self-center transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ------------------------------------------- bibliografia básica */}
        <section className="py-16">
          <SectionHeading
            numeral="I"
            title="Mais usados no semestre"
            description="Os títulos que os planos de ensino marcam como bibliografia básica — o que a turma abre primeiro."
            action={
              <Link
                href="/livros"
                className="text-primary inline-flex shrink-0 items-center gap-1.5 text-sm font-medium hover:underline"
              >
                Ver todos
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            }
          />
          <BookGrid entries={core} label="Bibliografia básica do semestre" />
        </section>

        {/* ------------------------------------------ livros compartilhados */}
        <section className="border-line border-t py-16">
          <SectionHeading
            numeral="II"
            title="Compartilhados entre disciplinas"
            description="Um mesmo livro serve a mais de uma unidade curricular. Aqui ele tem um único registro — e mostra o papel que cumpre em cada uma."
          />

          <ul className="grid gap-4 sm:grid-cols-2">
            {shared.map((entry) => (
              <li
                key={entry.book.id}
                className="border-line bg-surface rounded-[var(--radius-card)] border p-5"
              >
                <div className="flex items-start gap-2">
                  <h3 className="text-base leading-snug font-semibold text-pretty">
                    <Link href={`/livros/${entry.book.slug}`} className="hover:text-primary">
                      {entry.book.title}
                    </Link>
                  </h3>
                </div>

                <ul className="mt-4 space-y-2">
                  {entry.links.map((link) => (
                    <li
                      key={link.disciplineId}
                      className="border-line flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-sm"
                    >
                      <Link
                        href={`/disciplinas/${link.discipline.slug}`}
                        className="text-ink-muted hover:text-primary flex items-center gap-2"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: link.discipline.color }}
                          aria-hidden="true"
                        />
                        {link.discipline.name}
                      </Link>
                      <BibliographyBadge type={link.bibliographyType} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        {/* --------------------------------------------------- disciplinas */}
        <section className="border-line border-t py-16">
          <SectionHeading
            numeral="III"
            title="Explorar por disciplina"
            description="Ementa oficial, conteúdos por unidade, bibliografia separada por tipo e o plano de ensino completo."
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
        </section>

        {/* ------------------------------------------------------ recentes */}
        <section className="border-line border-t py-16">
          <SectionHeading
            numeral="IV"
            title="Adicionados recentemente"
            description="Catalogados em 18 de setembro de 2026, a partir da primeira leitura completa dos planos de ensino."
          />
          <BookGrid entries={recent} label="Livros adicionados recentemente" />
        </section>

        {/* -------------------------------------------------- estatísticas */}
        <section className="border-line border-t py-16">
          <SectionHeading
            numeral="V"
            title="O acervo em números"
            description="Tudo conferido contra os documentos oficiais — inclusive o que ainda precisa de revisão."
          />

          <dl className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
            {[
              { value: stats.books, label: "livros catalogados", hint: "sem duplicatas" },
              { value: stats.disciplines, label: "disciplinas", hint: "1º período, 2026.2" },
              {
                value: stats.sharedBooks,
                label: "usados em mais de uma",
                hint: "um registro, várias relações",
              },
              {
                value: stats.pendingReview,
                label: "pendentes de revisão",
                hint: "erros vindos do próprio plano",
              },
            ].map((item) => (
              <div key={item.label} className="border-line border-t pt-4">
                <dd className="font-display text-primary text-5xl font-semibold tabular-nums sm:text-6xl">
                  {item.value}
                </dd>
                <dt className="mt-2 text-sm font-medium">{item.label}</dt>
                <p className="text-ink-faint mt-0.5 text-xs">{item.hint}</p>
              </div>
            ))}
          </dl>

          <div className="border-line bg-surface-sunken mt-6 rounded-[var(--radius-card)] border p-5">
            <h3 className="text-sm font-semibold">Direitos autorais e uso acadêmico</h3>
            <p className="text-ink-muted mt-2 max-w-3xl text-sm leading-relaxed text-pretty">
              Biblioteca fechada para a turma.{" "}
              {stats.withFile === 0
                ? "Nenhum PDF foi postado ainda: os títulos aparecem como referência catalogada até alguém publicar o arquivo."
                : `${stats.withFile} ${stats.withFile === 1 ? "título tem" : "títulos têm"} PDF postado pela turma, cada um com origem e autorização registradas.`}{" "}
              Tudo o que está aqui é de uso interno — não redistribua fora do grupo.
            </p>
            <Link
              href="/uso-responsavel"
              className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            >
              Ler as regras de uso responsável
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
