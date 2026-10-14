import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PdfReader } from "@/components/book/pdf-reader";
import { isLesson, lessonDayLabel, lessonLabel } from "@/lib/domain/summary-types";
import { getSummaryBySlug } from "@/lib/repository/summaries";
import { signedFileUrl, storageMode } from "@/lib/storage";

// Com R2 a página carrega uma URL assinada que expira; renderiza por requisição.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const summary = await getSummaryBySlug(slug);
  if (!summary) notFound();
  return { title: `Resumo · ${summary.title}`, robots: { index: false } };
}

/** O resumo aberto, no mesmo leitor dos livros. */
export default async function ResumoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const summary = await getSummaryBySlug(slug);
  if (!summary) notFound();

  const route = `/api/resumos/${summary.pdfPath}`;
  const src =
    storageMode() === "r2"
      ? await signedFileUrl(summary.pdfPath, {
          download: false,
          downloadName: `${summary.slug}.pdf`,
          expiresIn: 3600,
          folder: "resumos",
        })
      : route;

  const etiqueta = isLesson(summary)
    ? `${lessonLabel(summary)} · ${lessonDayLabel(summary.date)}`
    : summary.cycleLabel;

  return (
    <div className="flex h-[calc(100dvh-4rem-3.5rem)] flex-col md:h-[calc(100dvh-4rem)]">
      <div className="border-line flex items-center gap-3 border-b px-4 py-2 sm:px-6">
        <Link
          href="/resumos"
          className="text-ink-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Resumos
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">
          <span className="text-ink-faint font-normal">{etiqueta} · </span>
          {summary.title}
        </h1>
      </div>
      <PdfReader src={src} title={summary.title} downloadHref={`${route}?baixar=1`} />
    </div>
  );
}
