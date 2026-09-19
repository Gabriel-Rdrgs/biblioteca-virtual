import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { BookTable, type AdminBookRow } from "@/components/admin/book-table";
import { NewBookForm } from "@/components/admin/new-book-form";
import { SectionHeading } from "@/components/ui/primitives";
import { readManifest } from "@/lib/catalog-store";
import { getAllBooksForAdmin, getDisciplines } from "@/lib/repository";
import { storageMode } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Administração",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const actionLabels: Record<string, string> = {
  livro_criado: "Livro cadastrado",
  arquivo_anexado: "PDF anexado",
  arquivo_removido: "PDF removido",
  visibilidade: "Visibilidade alterada",
  registro_excluido: "Registro excluído",
};

export default async function AdminPage() {
  const [books, manifest] = await Promise.all([getAllBooksForAdmin(), readManifest()]);

  const rows: AdminBookRow[] = books.map((book) => ({
    id: book.id,
    slug: book.slug,
    title: book.title,
    authors: book.authors,
    disciplines: book.disciplines.map((d) => d.shortName),
    visibility: book.visibility,
    hasFile: Boolean(book.file),
    ...(book.file ? { fileName: book.file.path, sizeBytes: book.file.sizeBytes } : {}),
    pending: book.provenance.reviewStatus === "pendente",
    fromPlan: book.provenance.sourceKind === "plano_de_ensino",
  }));

  const disciplines = getDisciplines().map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    shortName: d.shortName,
    color: d.color,
    colorSoft: d.colorSoft,
  }));

  const withFile = rows.filter((r) => r.hasFile).length;
  const visible = rows.filter((r) => r.visibility === "visivel").length;
  const log = [...manifest.log].reverse().slice(0, 20);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-accent text-xs font-semibold tracking-[0.18em] uppercase">
            Administração
          </p>
          <h1 className="mt-1 text-3xl font-semibold">Acervo da turma</h1>
          <p className="text-ink-muted mt-2 max-w-2xl text-sm leading-relaxed">
            {rows.length} registros · {withFile} com PDF · {visible} visíveis para a turma. Arquivos
            em{" "}
            <code className="font-mono text-xs">
              {storageMode() === "r2" ? "Cloudflare R2" : "storage/livros (disco local)"}
            </code>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="border-line hover:border-line-strong rounded-md border px-3 py-2 text-sm"
          >
            Ver como a turma
          </Link>
          <form method="post" action="/api/admin/sair">
            <button
              type="submit"
              className="border-line hover:border-line-strong inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sair do admin
            </button>
          </form>
        </div>
      </div>

      <section className="mt-12">
        <SectionHeading
          numeral="I"
          title="Publicar um livro novo"
          description="Envie o PDF, preencha a ficha, escolha as disciplinas e registre origem e autorização. O livro aparece para a turma assim que for salvo."
        />
        <div className="border-line bg-surface rounded-[var(--radius-card)] border p-5 sm:p-6">
          <NewBookForm disciplines={disciplines} />
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          numeral="II"
          title="Todos os registros"
          description="Livros dos planos de ensino e do acervo da turma. Anexe um PDF a um registro sem arquivo, oculte ou mostre, ou substitua o arquivo."
        />
        <BookTable rows={rows} />
      </section>

      <section className="mt-14">
        <SectionHeading numeral="III" title="Últimas alterações" />
        {log.length === 0 ? (
          <p className="text-ink-muted text-sm">Nenhuma alteração registrada ainda.</p>
        ) : (
          <ol className="divide-line border-line divide-y rounded-md border text-sm">
            {log.map((entry, i) => (
              <li key={`${entry.at}-${i}`} className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2.5">
                <time dateTime={entry.at} className="text-ink-faint tabular-nums">
                  {new Date(entry.at).toLocaleString("pt-BR")}
                </time>
                <span className="font-medium">{actionLabels[entry.action] ?? entry.action}</span>
                <span className="text-ink-muted">{entry.bookId}</span>
                {entry.detail ? <span className="text-ink-faint">{entry.detail}</span> : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
