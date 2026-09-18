import Link from "next/link";
import { ArrowRight, BookMarked, FileText, Layers, Search, Sparkles } from "lucide-react";
import { BookGrid } from "@/components/book/book-grid";
import { DisciplineCard } from "@/components/discipline/discipline-card";
import { SectionHeading, StatsCard } from "@/components/ui/primitives";
import { BibliographyBadge } from "@/components/book/book-badge";
import { AtlasMark } from "@/components/ui/atlas-mark";
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
  {
    href: "/livros",
    label: "Todos os livros",
    description: "O catálogo inteiro, com filtros",
    icon: BookMarked,
  },
  {
    href: "/disciplinas",
    label: "Disciplinas",
    description: "As sete unidades curriculares",
    icon: Layers,
  },
  {
    href: "/planos-de-ensino",
    label: "Planos de ensino",
    description: "Os documentos oficiais em PDF",
    icon: FileText,
  },
] as const;

export default function HomePage() {
  const stats = getStats();
  const disciplines = getDisciplines();
  const counts = getDisciplineBookCounts();
  const shared = getSharedBooks();
  const core = toCatalogEntries(getCoreBibliography().slice(0, 10));
  const recent = toCatalogEntries(getRecentlyAdded(5));

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

        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <span className="border-line bg-surface/70 text-ink-muted inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-wide backdrop-blur">
            <AtlasMark className="text-primary size-3.5" />
            Medicina · 1º período · UNIEURO · 2026.2
          </span>

          <h1 className="mx-auto mt-7 max-w-4xl text-[2.4rem] leading-[1.08] font-semibold sm:text-6xl">
            Toda a bibliografia do semestre,
            <span className="text-primary"> em um só lugar</span>.
          </h1>

          <p className="text-ink-muted mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty">
            {stats.books} títulos lidos diretamente dos {stats.teachingPlans} planos de ensino
            oficiais. Cada livro sabe em quais disciplinas é usado e de qual página do plano ele
            veio.
          </p>

          <form action="/busca" className="mx-auto mt-9 flex max-w-xl items-center gap-2">
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

          <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="group border-line bg-surface flex items-center gap-3 rounded-[var(--radius-card)] border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] motion-reduce:transform-none"
                >
                  <Icon className="text-primary size-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{shortcut.label}</span>
                    <span className="text-ink-faint block truncate text-xs">
                      {shortcut.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ------------------------------------------- bibliografia básica */}
        <section className="py-16">
          <SectionHeading
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
                  <Sparkles className="text-accent mt-1 size-4 shrink-0" aria-hidden="true" />
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
            title="Adicionados recentemente"
            description="Catalogados em 18 de setembro de 2026, a partir da primeira leitura completa dos planos de ensino."
          />
          <BookGrid entries={recent} label="Livros adicionados recentemente" />
        </section>

        {/* -------------------------------------------------- estatísticas */}
        <section className="border-line border-t py-16">
          <SectionHeading
            title="O acervo em números"
            description="Tudo conferido contra os documentos oficiais — inclusive o que ainda precisa de revisão."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard value={stats.books} label="Livros catalogados" hint="Sem duplicatas" />
            <StatsCard
              value={stats.disciplines}
              label="Disciplinas"
              hint="1º período, semestre 2026.2"
            />
            <StatsCard
              value={stats.sharedBooks}
              label="Usados em mais de uma"
              hint="Um registro, várias relações"
            />
            <StatsCard
              value={stats.pendingReview}
              label="Pendentes de revisão"
              hint="Erros vindos do próprio plano"
            />
          </div>

          <div className="border-line bg-surface-sunken mt-6 rounded-[var(--radius-card)] border p-5">
            <h3 className="text-sm font-semibold">Direitos autorais e uso acadêmico</h3>
            <p className="text-ink-muted mt-2 max-w-3xl text-sm leading-relaxed text-pretty">
              O Atlas é um catálogo de <strong className="text-ink font-medium">referências</strong>
              . Os {stats.institutionalAccess} títulos licenciados são lidos na plataforma Minha
              Biblioteca com o seu login do UNIEURO — nenhum arquivo comercial é hospedado ou
              redistribuído aqui. Apenas os planos de ensino, documentos institucionais do curso,
              ficam disponíveis para download.
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
