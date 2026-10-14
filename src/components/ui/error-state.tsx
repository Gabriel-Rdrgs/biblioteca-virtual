"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "./button";

/**
 * Erro de rota. Diz o que falhou em português simples e oferece a única
 * ação que costuma resolver — tentar de novo —, sem despejar a mensagem
 * técnica na cara de quem só queria estudar.
 */
export function ErrorState({
  title = "Esta parte não carregou",
  description = "Pode ter sido a conexão. Tente de novo; se insistir, avise no grupo da turma.",
  onRetry,
  detail,
}: {
  readonly title?: string;
  readonly description?: string;
  readonly onRetry?: () => void;
  /** Mensagem técnica, escondida atrás de um resumo. */
  readonly detail?: string;
}) {
  return (
    <div
      role="alert"
      className="border-danger/30 bg-danger-soft/40 rounded-card flex flex-col items-center justify-center border px-6 py-16 text-center"
    >
      <AlertTriangle className="text-danger size-9" aria-hidden="true" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-ink-muted mt-2 max-w-md text-sm leading-relaxed text-pretty">
        {description}
      </p>
      {onRetry ? (
        <Button variant="secundario" size="md" className="mt-6" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Tentar de novo
        </Button>
      ) : null}
      {detail ? (
        <details className="mt-6 max-w-md text-left">
          <summary className="text-ink-faint cursor-pointer text-xs">Detalhe técnico</summary>
          <pre className="text-ink-faint mt-2 overflow-x-auto text-xs whitespace-pre-wrap">
            {detail}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
