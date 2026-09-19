import { Info, ShieldAlert } from "lucide-react";
import type { AccessType, BookFile } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/**
 * States plainly how a given item may be reached. Shown on every book detail
 * page so no one has to guess whether a title can be downloaded.
 */
export function AccessNotice({
  access,
  file,
  className,
}: {
  access: AccessType;
  file?: BookFile;
  className?: string;
}) {
  const copy: Record<AccessType, { title: string; body: string; tone: "info" | "warn" }> = {
    public: {
      title: "Documento de acesso livre",
      body: "Publicação oficial de acesso aberto. Pode ser lida e baixada diretamente na fonte.",
      tone: "info",
    },
    reference_only: {
      title: "Referência catalogada — arquivo ainda não disponibilizado",
      body: "Esta obra consta na bibliografia do plano de ensino, mas ninguém da turma postou o arquivo ainda. Se você tiver uma cópia com direito de uso, fale com quem administra o Atlas.",
      tone: "warn",
    },
    class_only: {
      title: "PDF postado pela turma",
      body: file
        ? `Origem: ${file.origin}. Autorização: ${file.authorization}.${file.note ? ` ${file.note}` : ""} Uso interno da turma — não redistribua fora deste grupo.`
        : "Uso interno da turma — não redistribua fora deste grupo.",
      tone: "info",
    },
    restricted: {
      title: "Acesso restrito",
      body: "O acesso a este material depende de autorização específica.",
      tone: "warn",
    },
  };

  const { title, body, tone } = copy[access];
  const Icon = tone === "warn" ? ShieldAlert : Info;

  return (
    <aside
      className={cn(
        "flex gap-3 rounded-[var(--radius-card)] border p-4",
        tone === "warn"
          ? "border-line-strong bg-surface-sunken"
          : "border-primary/20 bg-primary-soft",
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "warn" ? "text-ink-muted" : "text-primary",
        )}
        aria-hidden="true"
      />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-ink-muted mt-1 text-sm leading-relaxed text-pretty">{body}</p>
      </div>
    </aside>
  );
}
