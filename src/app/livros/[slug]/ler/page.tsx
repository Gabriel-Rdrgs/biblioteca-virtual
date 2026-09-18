import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { getBookBySlug, getCatalog } from "@/lib/repository";

export function generateStaticParams() {
  return getCatalog()
    .filter((entry) => entry.book.file)
    .map((entry) => ({ slug: entry.book.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getBookBySlug(slug);
  return { title: entry ? `Ler · ${entry.book.title}` : "Leitura", robots: { index: false } };
}

/**
 * Full-height reader. The browser's own PDF viewer does the work — it is
 * the most reliable option on phones and needs no extra JavaScript.
 */
export default async function ReadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getBookBySlug(slug);
  if (!entry?.book.file) notFound();

  const src = `/api/arquivos/${entry.book.id}`;

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col md:h-[calc(100dvh-4rem)]">
      <div className="border-line flex items-center gap-3 border-b px-4 py-2.5 sm:px-6">
        <Link
          href={`/livros/${entry.book.slug}`}
          className="text-ink-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{entry.book.title}</h1>
        <a
          href={`${src}?baixar=1`}
          className="border-line hover:border-line-strong inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm"
        >
          <Download className="size-4" aria-hidden="true" />
          Baixar
        </a>
      </div>
      <iframe
        src={src}
        title={`Leitura de ${entry.book.title}`}
        className="bg-surface-sunken min-h-0 w-full flex-1"
      />
      <p className="text-ink-faint border-line border-t px-4 py-2 text-xs sm:px-6">
        Não abriu?{" "}
        <a href={src} className="underline">
          Abra em uma nova aba
        </a>{" "}
        ou baixe o arquivo. Origem: {entry.book.file.origin}.
      </p>
    </div>
  );
}
