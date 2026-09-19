"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Minus, Plus } from "lucide-react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { cn } from "@/lib/utils";

/**
 * In-page PDF reader built on PDF.js.
 *
 * Browsers disagree about PDFs inside iframes — Android Chrome simply
 * downloads them — so pages are drawn to canvases instead. Only pages near
 * the viewport are rendered, and far-away ones are released, which keeps a
 * 1,400-page textbook usable on a phone. The file itself arrives in ranges.
 */

interface PdfReaderProps {
  readonly src: string;
  readonly title: string;
  readonly downloadHref: string;
}

type Status = "carregando" | "pronto" | "erro";

/** Pages this many positions away from the current one are kept rendered. */
const RENDER_WINDOW = 2;
const ZOOM_STEPS = [0.6, 0.8, 1, 1.25, 1.5, 2];

export function PdfReader({ src, title, downloadHref }: PdfReaderProps) {
  const [status, setStatus] = useState<Status>("carregando");
  const [error, setError] = useState<string>("");
  const [numPages, setNumPages] = useState(0);
  const [current, setCurrent] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pageAspect, setPageAspect] = useState(1.414);
  const [loaded, setLoaded] = useState<{ received: number; total: number } | null>(null);

  const docRef = useRef<PDFDocumentProxy | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visible, setVisible] = useState<Set<number>>(new Set([1]));

  // ---------------------------------------------------------------- load
  useEffect(() => {
    let cancelled = false;
    let doc: PDFDocumentProxy | null = null;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const task = pdfjs.getDocument({
          url: src,
          // Range-only mode: the probe request is dropped as soon as the
          // server says it accepts ranges, and nothing is prefetched beyond
          // the pages on screen. Streaming mode would keep the full download
          // running in the background.
          rangeChunkSize: 512 * 1024,
          disableAutoFetch: true,
          disableStream: true,
        });
        task.onProgress = (p: { loaded: number; total?: number }) => {
          if (!cancelled) setLoaded({ received: p.loaded, total: p.total ?? 0 });
        };

        doc = await task.promise;
        if (cancelled) return;
        docRef.current = doc;

        const first = await doc.getPage(1);
        const viewport = first.getViewport({ scale: 1 });
        setPageAspect(viewport.height / viewport.width);
        setNumPages(doc.numPages);
        setStatus("pronto");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Falha ao abrir o PDF.");
        setStatus("erro");
      }
    })();

    return () => {
      cancelled = true;
      doc?.destroy().catch(() => undefined);
      docRef.current = null;
    };
  }, [src]);

  // ----------------------------------------------------------- visibility
  useEffect(() => {
    if (status !== "pronto" || !scrollRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const page = Number((entry.target as HTMLElement).dataset.page);
            if (entry.isIntersecting) next.add(page);
            else next.delete(page);
          }
          return next;
        });
      },
      { root: scrollRef.current, rootMargin: "50% 0px" },
    );

    for (const el of pageRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [status, numPages]);

  // Current page = the visible one closest to the top of the viewport.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || status !== "pronto") return;

    const onScroll = () => {
      let best = current;
      let bestDistance = Number.POSITIVE_INFINITY;
      const rootTop = root.getBoundingClientRect().top;
      for (const el of pageRefs.current) {
        if (!el) continue;
        const distance = Math.abs(el.getBoundingClientRect().top - rootTop);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = Number(el.dataset.page);
        }
      }
      if (best !== current) setCurrent(best);
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [status, current]);

  const goTo = useCallback(
    (page: number) => {
      const target = Math.min(Math.max(1, page), numPages);
      const root = scrollRef.current;
      const el = pageRefs.current[target - 1];
      // Scroll the reader itself, never the window — scrollIntoView would
      // also drag the toolbars off the top of the screen.
      if (root && el) {
        root.scrollTop = el.offsetTop;
      }
      setCurrent(target);
    },
    [numPages],
  );

  const zoomIndex = ZOOM_STEPS.indexOf(zoom);
  const zoomBy = (delta: number) => {
    const next = ZOOM_STEPS[Math.min(Math.max(0, zoomIndex + delta), ZOOM_STEPS.length - 1)];
    if (next !== undefined) setZoom(next);
  };

  const shouldRender = (page: number) => {
    if (visible.has(page)) return true;
    for (const v of visible) if (Math.abs(v - page) <= RENDER_WINDOW) return true;
    return false;
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-line bg-canvas flex flex-wrap items-center gap-2 border-b px-3 py-2 text-sm sm:px-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={status !== "pronto" || current <= 1}
            className="border-line inline-flex size-8 items-center justify-center rounded-md border disabled:opacity-40"
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <label className="flex items-center gap-1 tabular-nums">
            <span className="sr-only">Ir para a página</span>
            <input
              type="number"
              min={1}
              max={numPages || 1}
              value={current}
              onChange={(event) => goTo(Number(event.target.value))}
              disabled={status !== "pronto"}
              className="border-line bg-surface w-14 rounded-md border px-2 py-1 text-center"
            />
            <span className="text-ink-muted">/ {numPages || "…"}</span>
          </label>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={status !== "pronto" || current >= numPages}
            className="border-line inline-flex size-8 items-center justify-center rounded-md border disabled:opacity-40"
            aria-label="Próxima página"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => zoomBy(-1)}
            disabled={zoomIndex <= 0}
            className="border-line inline-flex size-8 items-center justify-center rounded-md border disabled:opacity-40"
            aria-label="Diminuir zoom"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="text-ink-muted w-12 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => zoomBy(1)}
            disabled={zoomIndex >= ZOOM_STEPS.length - 1}
            className="border-line inline-flex size-8 items-center justify-center rounded-md border disabled:opacity-40"
            aria-label="Aumentar zoom"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
          <a
            href={downloadHref}
            className="border-line hover:border-line-strong ml-2 inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5"
          >
            <Download className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Baixar</span>
            <span className="sr-only sm:hidden">Baixar</span>
          </a>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="bg-surface-sunken relative min-h-0 flex-1 overflow-auto"
        role="document"
        aria-label={`Leitura de ${title}`}
        aria-busy={status === "carregando"}
      >
        {status === "carregando" ? (
          <p role="status" className="text-ink-muted p-6 text-center text-sm">
            Abrindo o PDF…
            {loaded && loaded.total > 0
              ? ` ${Math.round((loaded.received / loaded.total) * 100)}%`
              : ""}
          </p>
        ) : null}

        {status === "erro" ? (
          <div className="mx-auto max-w-md p-6 text-center">
            <p className="font-semibold">Não foi possível abrir o PDF aqui.</p>
            <p className="text-ink-muted mt-1 text-sm">{error}</p>
            <a href={downloadHref} className="text-primary mt-4 inline-block text-sm underline">
              Baixar o arquivo
            </a>
          </div>
        ) : null}

        {status === "pronto" ? (
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 p-2 sm:p-4">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
              <PageSlot
                key={page}
                page={page}
                doc={docRef.current}
                zoom={zoom}
                aspect={pageAspect}
                render={shouldRender(page)}
                ref={(el) => {
                  pageRefs.current[page - 1] = el;
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ page
interface PageSlotProps {
  readonly page: number;
  readonly doc: PDFDocumentProxy | null;
  readonly zoom: number;
  readonly aspect: number;
  readonly render: boolean;
  readonly ref: (el: HTMLDivElement | null) => void;
}

function PageSlot({ page, doc, zoom, aspect, render, ref }: PageSlotProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const holderRef = useRef<HTMLDivElement | null>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (!render || !doc || !holderRef.current) {
      setDrawn(false);
      return;
    }

    let cancelled = false;
    let renderTask: ReturnType<PDFPageProxy["render"]> | null = null;

    (async () => {
      try {
        const pdfPage = await doc.getPage(page);
        if (cancelled || !holderRef.current || !canvasRef.current) return;

        const width = holderRef.current.clientWidth;
        const base = pdfPage.getViewport({ scale: 1 });
        const scale = (width / base.width) * zoom;
        const viewport = pdfPage.getViewport({ scale });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);

        const canvas = canvasRef.current;
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const context = canvas.getContext("2d");
        if (!context) return;
        renderTask = pdfPage.render({
          canvasContext: context,
          viewport,
          transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
        });
        await renderTask.promise;
        if (!cancelled) setDrawn(true);
      } catch (err) {
        // A cancelled render throws; anything else is left blank rather than
        // taking the whole reader down.
        if (!cancelled && !(err instanceof Error && err.name === "RenderingCancelledException")) {
          setDrawn(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [render, doc, page, zoom]);

  return (
    <div
      ref={(el) => {
        holderRef.current = el;
        ref(el);
      }}
      data-page={page}
      className="w-full"
      aria-label={`Página ${page}`}
    >
      {/* The slot is always full width; the canvas may grow past it when
          zoomed and the scroll container takes over horizontally. */}
      {render ? (
        <canvas
          ref={canvasRef}
          className={cn(
            "bg-surface block shadow-[var(--shadow-raise)] transition-opacity",
            drawn ? "opacity-100" : "opacity-0",
          )}
          style={{ width: `${zoom * 100}%`, aspectRatio: `1 / ${aspect}` }}
        />
      ) : (
        <div
          className="bg-surface shadow-[var(--shadow-raise)]"
          style={{ width: `${zoom * 100}%`, aspectRatio: `1 / ${aspect}` }}
        />
      )}
    </div>
  );
}
