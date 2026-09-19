import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PdfReader } from "@/components/book/pdf-reader";
import { isAdminRequest } from "@/lib/audience";
import { getBookBySlug, recordAccess } from "@/lib/repository";
import { signedFileUrl, storageMode } from "@/lib/storage";

// Rendered per request: with R2 the page carries a signed URL that expires.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getBookBySlug(slug);
  if (!entry?.book.file) notFound();
  return { title: `Ler · ${entry.book.title}`, robots: { index: false } };
}

/** Full-height reader; PdfReader draws the pages itself. */
export default async function ReadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [entry, admin] = await Promise.all([getBookBySlug(slug), isAdminRequest()]);
  if (!entry?.book.file) notFound();

  // A failure to count must never keep someone from reading.
  await recordAccess(entry.book.id).catch(() => undefined);

  const route = `/api/arquivos/${entry.book.id}`;
  // With R2 the reader fetches straight from the bucket, ranges and all,
  // instead of bouncing every 512 KB chunk through a redirect.
  const src =
    storageMode() === "r2"
      ? await signedFileUrl(entry.book.file.path, {
          download: false,
          downloadName: `${entry.book.slug}.pdf`,
          expiresIn: 3600,
        })
      : route;

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
      <PdfReader src={src} title={entry.book.title} downloadHref={`${route}?baixar=1`} />
      {admin && entry.book.file.note ? (
        <p className="text-accent border-line border-t px-4 py-1.5 text-xs sm:px-6">
          {entry.book.file.note}
        </p>
      ) : null}
    </div>
  );
}
