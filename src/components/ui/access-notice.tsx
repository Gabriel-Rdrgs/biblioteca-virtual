import { Info, ShieldAlert } from "lucide-react";
import type { AccessType } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/**
 * States plainly how a given item may be reached. Shown on every book detail
 * page so no one has to guess whether a title can be downloaded.
 */
export function AccessNotice({ access, className }: { access: AccessType; className?: string }) {
  const copy: Record<AccessType, { title: string; body: string; tone: "info" | "warn" }> = {
    institutional: {
      title: "Leitura pela biblioteca institucional",
      body: "Este título é licenciado e lido na plataforma Minha Biblioteca com o seu login do UNIEURO. O Atlas guarda apenas a referência e o link de acesso — nenhum arquivo é hospedado aqui.",
      tone: "info",
    },
    public: {
      title: "Documento de acesso livre",
      body: "Publicação oficial de acesso aberto. Pode ser lida e baixada diretamente na fonte.",
      tone: "info",
    },
    reference_only: {
      title: "Referência catalogada — arquivo ainda não disponibilizado",
      body: "Esta obra consta na bibliografia do plano de ensino, mas não há link institucional nem arquivo autorizado registrado. Consulte a biblioteca do UNIEURO para verificar a disponibilidade.",
      tone: "warn",
    },
    class_only: {
      title: "Material compartilhado pela turma",
      body: "Conteúdo de uso interno, restrito aos estudantes da turma. Não redistribua fora deste grupo.",
      tone: "warn",
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
