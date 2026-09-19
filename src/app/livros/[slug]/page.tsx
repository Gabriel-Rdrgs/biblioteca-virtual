import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Download, ExternalLink, FileWarning } from "lucide-react";
import { BookCover } from "@/components/book/book-cover";
import { BookCardCompact } from "@/components/book/book-card";
import { BibliographyBadge, KindBadge, bibliographyLabels } from "@/components/book/book-badge";
import { FavoriteButton } from "@/components/book/favorite-button";
import { Breadcrumbs } from "@/components/ui/primitives";
import { isAdminRequest } from "@/lib/audience";
import { getBookBySlug, getRelatedBooks, toCatalogEntries } from "@/lib/repository";

// The catalogue is edited at runtime by the admin area; render per request.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getBookBySlug(slug);
  if (!entry) notFound();

  return {
    title: entry.book.title,
    description: `${entry.book.title} — ${entry.book.authors.join("; ")}.`,
  };
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line/60 border-t py-2.5">
      <dt className="text-ink-faint text-xs tracking-[0.08em] uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [entry, admin] = await Promise.all([getBookBySlug(slug), isAdminRequest()]);
  if (!entry) notFound();

  const { book, links } = entry;
  const related = toCatalogEntries(await getRelatedBooks(slug, 4), { admin });
  const pending = admin && book.provenance.reviewStatus === "pendente";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Estante", href: "/livros" },
          { label: book.title },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,17rem)_1fr] lg:gap-14">
        <div className="mx-auto w-52 sm:w-60 lg:mx-0 lg:w-full">
          <BookCover book={book} size="lg" />
          <p className="text-ink-faint mt-3 text-center text-xs leading-relaxed lg:text-left">
            Capa ilustrativa — não é a da editora.
          </p>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <KindBadge kind={book.kind} />
            {links.length > 1 ? (
              <span className="text-ink-muted text-xs">Vale para {links.length} matérias</span>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{book.title}</h1>
          {book.subtitle ? (
            <p className="text-ink-muted mt-2 text-lg leading-snug text-pretty">{book.subtitle}</p>
          ) : null}

          <p className="text-ink-muted mt-4 text-[0.95rem]">{book.authors.join("; ")}</p>

          {pending ? (
            <div className="border-danger/25 bg-danger-soft mt-6 flex gap-3 rounded-2xl border p-4">
              <FileWarning className="text-danger mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-danger text-sm font-semibold">
                  Registro pendente de revisão (visível só para admin)
                </p>
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
                  className="bg-primary text-on-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-[var(--shadow-raise)] transition-colors"
                >
                  <BookOpen className="size-4" aria-hidden="true" />
                  Ler agora
                </Link>
                <a
                  href={`/api/arquivos/${book.id}?baixar=1`}
                  className="glass hover:glass-strong inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Baixar
                  {book.file.sizeBytes ? (
                    <span className="text-ink-faint">
                      {(book.file.sizeBytes / 1048576).toFixed(0)} MB
                    </span>
                  ) : null}
                </a>
              </>
            ) : book.externalUrl ? (
              <a
                href={book.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-on-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Abrir na fonte oficial
              </a>
            ) : (
              <span className="glass text-ink-muted inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm">
                <FileWarning className="size-4" aria-hidden="true" />
                Arquivo ainda não disponibilizado
              </span>
            )}
            <FavoriteButton bookId={book.id} title={book.title} />
          </div>

          {book.file && admin && (book.file.origin || book.file.note) ? (
            <aside className="glass mt-6 rounded-2xl p-4 text-sm">
              <p className="font-semibold">Ficha do arquivo (visível só para admin)</p>
              <dl className="text-ink-muted mt-2 space-y-1">
                {book.file.origin ? (
                  <div>
                    <dt className="inline font-medium">Origem: </dt>
                    <dd className="inline">{book.file.origin}</dd>
                  </div>
                ) : null}
                {book.file.authorization ? (
                  <div>
                    <dt className="inline font-medium">Autorização: </dt>
                    <dd className="inline">{book.file.authorization}</dd>
                  </div>
                ) : null}
                {book.file.note ? (
                  <div>
                    <dt className="inline font-medium">Nota: </dt>
                    <dd className="inline">{book.file.note}</dd>
                  </div>
                ) : null}
              </dl>
            </aside>
          ) : null}

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Onde este livro entra</h2>
            <ul className="mt-4 space-y-3">
              {links.map((link) => (
                <li key={link.disciplineId} className="glass rounded-2xl p-4">
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
                </li>
              ))}
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
                {book.isbn ? <Field label="ISBN" value={book.isbn} /> : null}
              </dl>
            </div>

            {book.topics.length > 0 ? (
              <div>
                <h2 className="mb-1 text-lg font-semibold">Temas</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {book.topics.map((topic) => (
                    <li key={topic} className="glass text-ink-muted rounded-full px-3 py-1 text-xs">
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {admin ? (
            <section className="mt-10">
              <h2 className="text-lg font-semibold">Origem do registro (visível só para admin)</h2>
              {book.provenance.sourceKind === "plano_de_ensino" ? (
                <p className="text-ink-muted mt-2 text-sm leading-relaxed text-pretty">
                  Transcrito da seção{" "}
                  <strong className="text-ink font-medium">{book.provenance.sourceSection}</strong>{" "}
                  (página {book.provenance.sourcePage}) do plano de ensino, onde consta como{" "}
                  {bibliographyLabels[links[0]?.bibliographyType ?? "basica"].toLowerCase()}.
                </p>
              ) : (
                <p className="text-ink-muted mt-2 text-sm leading-relaxed text-pretty">
                  Não consta em nenhum plano de ensino. Foi adicionado ao acervo da turma e os dados
                  bibliográficos foram lidos do próprio arquivo.
                </p>
              )}
              <blockquote className="glass text-ink-muted mt-3 rounded-2xl px-4 py-3 font-mono text-xs leading-relaxed">
                {book.provenance.rawCitation}
              </blockquote>
            </section>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="text-xl font-semibold">Quem lê este também abre</h2>
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
