import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PdfReader } from "@/components/book/pdf-reader";
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

/** Full-height reader; PdfReader draws the pages itself. */
export default async function ReadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getBookBySlug(slug);
  if (!entry?.book.file) notFound();

  const src = `/api/arquivos/${entry.book.id}`;

  return (
    <div className="flex h-[calc(100dvh-4rem-3.5rem)] flex-col md:h-[calc(100dvh-4rem)]">
      <div className="border-line flex items-center gap-3 border-b px-4 py-2 sm:px-6">
        <Link
          href={`/livros/${entry.book.slug}`}
          className="text-ink-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{entry.book.title}</h1>
      </div>
      <PdfReader src={src} title={entry.book.title} downloadHref={`${src}?baixar=1`} />
      {entry.book.file.note ? (
        <p className="text-accent border-line border-t px-4 py-1.5 text-xs sm:px-6">
          {entry.book.file.note}
        </p>
      ) : null}
    </div>
  );
}
