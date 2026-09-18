import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Download, ExternalLink, FileWarning } from "lucide-react";
import { BookCover } from "@/components/book/book-cover";
import { BookCardCompact } from "@/components/book/book-card";
import {
  AccessBadge,
  BibliographyBadge,
  KindBadge,
  SharedBadge,
  bibliographyLabels,
} from "@/components/book/book-badge";
import { AccessNotice } from "@/components/ui/access-notice";
import { Breadcrumbs } from "@/components/ui/primitives";
import { FavoriteButton } from "@/components/book/favorite-button";
import {
  getBookBySlug,
  getCatalog,
  getRelatedBooks,
  getTeachingPlanForDiscipline,
  toCatalogEntries,
} from "@/lib/repository";

export function generateStaticParams() {
  return getCatalog().map((entry) => ({ slug: entry.book.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getBookBySlug(slug);
  if (!entry) return { title: "Livro não encontrado" };

  return {
    title: entry.book.title,
    description: `${entry.book.title} — ${entry.book.authors.join("; ")}. Bibliografia de ${entry.links
      .map((link) => link.discipline.name)
      .join(", ")}.`,
  };
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line border-t py-2.5">
      <dt className="text-ink-faint text-xs tracking-[0.08em] uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getBookBySlug(slug);
  if (!entry) notFound();

  const { book, links } = entry;
  const related = toCatalogEntries(getRelatedBooks(slug, 4));
  const pending = book.provenance.reviewStatus === "pendente";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Livros", href: "/livros" },
          { label: book.title },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,17rem)_1fr] lg:gap-14">
        <div className="mx-auto w-52 sm:w-60 lg:mx-0 lg:w-full">
          <BookCover book={book} size="lg" />
          <p className="text-ink-faint mt-3 text-center text-xs leading-relaxed lg:text-left">
            Capa ilustrativa gerada pelo Atlas a partir dos dados do livro. Não é a capa oficial da
            editora.
          </p>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <KindBadge kind={book.kind} />
            <SharedBadge count={links.length} />
          </div>

          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{book.title}</h1>
          {book.subtitle ? (
            <p className="text-ink-muted mt-2 text-lg leading-snug text-pretty">{book.subtitle}</p>
          ) : null}

          <p className="text-ink-muted mt-4 text-[0.95rem]">{book.authors.join("; ")}</p>

          {pending ? (
            <div className="border-danger/25 bg-danger-soft mt-6 flex gap-3 rounded-[var(--radius-card)] border p-4">
              <FileWarning className="text-danger mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-danger text-sm font-semibold">Registro pendente de revisão</p>
                <p className="text-ink-muted mt-1 text-sm leading-relaxed text-pretty">
                  {book.provenance.reviewNote}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {book.file ? (
              <>
                <Link
                  href={`/livros/${book.slug}/ler`}
                  className="bg-primary text-on-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  <BookOpen className="size-4" aria-hidden="true" />
                  Ler PDF
                </Link>
                <a
                  href={`/api/arquivos/${book.id}?baixar=1`}
                  className="border-line hover:border-line-strong hover:bg-surface-sunken inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Baixar
                </a>
              </>
            ) : book.externalUrl ? (
              <a
                href={book.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-on-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Abrir na fonte oficial
              </a>
            ) : (
              <span className="border-line-strong text-ink-muted inline-flex items-center gap-2 rounded-md border border-dashed px-5 py-2.5 text-sm">
                <FileWarning className="size-4" aria-hidden="true" />
                Arquivo ainda não disponibilizado
              </span>
            )}
            <FavoriteButton bookId={book.id} title={book.title} />
          </div>

          <AccessNotice access={book.accessType} file={book.file} className="mt-6" />

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Onde este livro é usado</h2>
            <ul className="mt-4 space-y-3">
              {links.map((link) => {
                const plan = getTeachingPlanForDiscipline(link.disciplineId);
                return (
                  <li
                    key={link.disciplineId}
                    className="border-line bg-surface rounded-[var(--radius-card)] border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/disciplinas/${link.discipline.slug}`}
                        className="hover:text-primary flex items-center gap-2.5 font-medium"
                      >
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: link.discipline.color }}
                          aria-hidden="true"
                        />
                        {link.discipline.name}
                      </Link>
                      <BibliographyBadge type={link.bibliographyType} />
                    </div>
                    {link.notes ? (
                      <p className="text-ink-muted mt-2 text-sm leading-relaxed">{link.notes}</p>
                    ) : null}
                    {plan ? (
                      <Link
                        href="/planos-de-ensino"
                        className="text-primary mt-2 inline-block text-sm hover:underline"
                      >
                        Ver o plano de ensino
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-10 grid gap-x-10 sm:grid-cols-2">
            <div>
              <h2 className="mb-1 text-lg font-semibold">Ficha</h2>
              <dl>
                {book.publisher ? <Field label="Editora" value={book.publisher} /> : null}
                {book.publicationYear ? (
                  <Field label="Ano" value={String(book.publicationYear)} />
                ) : null}
                {book.edition ? <Field label="Edição" value={book.edition} /> : null}
                <Field label="ISBN" value={book.isbn ?? "Não informado no plano"} />
              </dl>
            </div>

            <div>
              <h2 className="mb-1 text-lg font-semibold">Temas</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {book.topics.map((topic) => (
                  <li
                    key={topic}
                    className="border-line text-ink-muted rounded-full border px-2.5 py-1 text-xs"
                  >
                    {topic}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <AccessBadge access={book.accessType} />
              </div>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Origem do registro</h2>
            <p className="text-ink-muted mt-2 text-sm leading-relaxed text-pretty">
              Transcrito da seção{" "}
              <strong className="text-ink font-medium">{book.provenance.sourceSection}</strong>{" "}
              (página {book.provenance.sourcePage}) do plano de ensino, onde consta como{" "}
              {bibliographyLabels[links[0]?.bibliographyType ?? "basica"].toLowerCase()}.
            </p>
            <blockquote className="border-line-strong bg-surface-sunken text-ink-muted mt-3 border-l-2 px-4 py-3 font-mono text-xs leading-relaxed">
              {book.provenance.rawCitation}
            </blockquote>
          </section>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="border-line mt-16 border-t pt-10">
          <h2 className="text-xl font-semibold">Livros relacionados</h2>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {related.map((item) => (
              <li key={item.book.id}>
                <BookCardCompact entry={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
