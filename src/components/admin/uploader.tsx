"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sends a PDF to storage before any metadata is saved.
 *
 * 1. The first bytes are checked in the browser (a real PDF starts with
 *    "%PDF-"), so an obvious mistake fails before a long upload.
 * 2. The server mints a safe file name and says where to PUT the bytes:
 *    a presigned bucket URL in production, a local route in development.
 * 3. XMLHttpRequest does the transfer — unlike fetch it reports upload
 *    progress and can be aborted.
 */

export interface UploadedFile {
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly originalName: string;
}

const MAX_BYTES = 1024 * 1024 * 1024;

function formatMb(bytes: number): string {
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

async function looksLikePdf(file: File): Promise<boolean> {
  const head = await file.slice(0, 5).arrayBuffer();
  return new TextDecoder("latin1").decode(head) === "%PDF-";
}

export function Uploader({
  onUploaded,
  onReset,
  idPrefix = "up",
  folder = "livros",
  label = "Escolher o PDF",
}: {
  onUploaded: (file: UploadedFile) => void;
  onReset?: () => void;
  idPrefix?: string;
  folder?: "livros" | "planos";
  label?: string;
}) {
  const [state, setState] = useState<
    | { phase: "idle" }
    | { phase: "enviando"; name: string; pct: number; bytes: number }
    | { phase: "pronto"; file: UploadedFile }
    | { phase: "erro"; message: string }
  >({ phase: "idle" });
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setState({ phase: "idle" });
    if (inputRef.current) inputRef.current.value = "";
    onReset?.();
  };

  const start = async (file: File) => {
    if (!/\.pdf$/i.test(file.name) || !(await looksLikePdf(file))) {
      setState({ phase: "erro", message: "Escolha um arquivo PDF válido." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setState({ phase: "erro", message: "O arquivo passa de 1 GB." });
      return;
    }

    setState({ phase: "enviando", name: file.name, pct: 0, bytes: file.size });

    const ticket = await fetch("/api/admin/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, sizeBytes: file.size, folder }),
    });
    if (!ticket.ok) {
      const body = (await ticket.json().catch(() => ({}))) as { error?: string };
      setState({ phase: "erro", message: body.error ?? "Não foi possível iniciar o envio." });
      return;
    }
    const { url, fileName } = (await ticket.json()) as { url: string; fileName: string };

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", "application/pdf");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setState({
          phase: "enviando",
          name: file.name,
          pct: Math.round((event.loaded / event.total) * 100),
          bytes: file.size,
        });
      }
    };
    xhr.onload = () => {
      xhrRef.current = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        const uploaded = { fileName, sizeBytes: file.size, originalName: file.name };
        setState({ phase: "pronto", file: uploaded });
        onUploaded(uploaded);
      } else {
        setState({ phase: "erro", message: `O storage recusou o envio (HTTP ${xhr.status}).` });
      }
    };
    xhr.onerror = () => {
      xhrRef.current = null;
      setState({
        phase: "erro",
        message:
          "Falha de rede durante o envio. Confira a conexão (e, em produção, o CORS do bucket).",
      });
    };
    xhr.onabort = () => {
      xhrRef.current = null;
    };
    xhr.send(file);
  };

  if (state.phase === "pronto") {
    return (
      <div className="border-sage/40 bg-sage-soft rounded-control flex items-center gap-3 border p-3 text-sm">
        <CheckCircle2 className="text-sage size-5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">
          <strong className="font-medium">{state.file.originalName}</strong> ·{" "}
          {formatMb(state.file.sizeBytes)} enviado
        </span>
        <button type="button" onClick={reset} className="text-ink-muted hover:text-ink text-xs">
          Trocar
        </button>
      </div>
    );
  }

  if (state.phase === "enviando") {
    return (
      <div className="border-line rounded-control border p-3 text-sm" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate">
            Enviando <strong className="font-medium">{state.name}</strong> ({formatMb(state.bytes)})
          </span>
          <button
            type="button"
            onClick={reset}
            className="text-danger inline-flex items-center gap-1 text-xs"
          >
            <X className="size-3.5" aria-hidden="true" />
            Cancelar
          </button>
        </div>
        <div
          className="bg-surface-sunken mt-2 h-2 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={state.pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="bg-primary h-full transition-[width]"
            style={{ width: `${state.pct}%` }}
          />
        </div>
        <p className="text-ink-faint mt-1 text-xs tabular-nums">{state.pct}%</p>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={`${idPrefix}-file`}
        className={cn(
          "border-line-strong hover:border-primary hover:bg-primary-soft/40 rounded-control flex cursor-pointer flex-col items-center gap-2 border border-dashed px-4 py-8 text-center text-sm transition-colors",
        )}
      >
        <FileUp className="text-ink-faint size-6" aria-hidden="true" />
        <span className="font-medium">{label}</span>
        <span className="text-ink-faint text-xs">Até 1 GB. O envio começa na hora.</span>
      </label>
      <input
        ref={inputRef}
        id={`${idPrefix}-file`}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void start(file);
        }}
      />
      {state.phase === "erro" ? (
        <p role="alert" className="text-danger mt-2 text-sm">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
