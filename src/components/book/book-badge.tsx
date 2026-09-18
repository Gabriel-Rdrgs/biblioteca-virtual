import { FileText, FileWarning, Globe, Scale } from "lucide-react";
import type { AccessType, BibliographyType, MaterialKind } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export const bibliographyLabels: Record<BibliographyType, string> = {
  basica: "Básica",
  basica_virtual: "Básica virtual",
  complementar: "Complementar",
  outras_referencias: "Outras referências",
};

const bibliographyStyles: Record<BibliographyType, string> = {
  basica: "bg-primary text-on-primary",
  basica_virtual: "bg-primary-soft text-primary",
  complementar: "bg-sage-soft text-sage",
  outras_referencias: "bg-surface-sunken text-ink-muted",
};

export function BibliographyBadge({
  type,
  className,
}: {
  type: BibliographyType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        bibliographyStyles[type],
        className,
      )}
    >
      {bibliographyLabels[type]}
    </span>
  );
}

export const accessLabels: Record<AccessType, string> = {
  public: "Acesso livre",
  class_only: "PDF disponível",
  restricted: "Acesso restrito",
  reference_only: "Somente referência",
};

const accessDescriptions: Record<AccessType, string> = {
  public: "Documento público, disponível para leitura e download na fonte.",
  class_only: "PDF postado pela turma. Leitura e download atrás da senha da turma.",
  restricted: "Acesso sob autorização.",
  reference_only: "Referência catalogada — arquivo ainda não disponibilizado.",
};

const accessIcons: Record<AccessType, typeof Globe> = {
  public: Globe,
  class_only: FileText,
  restricted: Scale,
  reference_only: FileWarning,
};

const accessStyles: Record<AccessType, string> = {
  public: "text-sage",
  class_only: "text-primary font-medium",
  restricted: "text-danger",
  reference_only: "text-ink-faint",
};

export function AccessBadge({
  access,
  className,
  withIcon = true,
}: {
  access: AccessType;
  className?: string;
  withIcon?: boolean;
}) {
  const Icon = accessIcons[access];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs", accessStyles[access], className)}
      title={accessDescriptions[access]}
    >
      {withIcon ? <Icon className="size-3.5 shrink-0" aria-hidden="true" /> : null}
      {accessLabels[access]}
    </span>
  );
}

export function accessDescription(access: AccessType): string {
  return accessDescriptions[access];
}

export const kindLabels: Record<MaterialKind, string> = {
  livro: "Livro",
  norma: "Norma",
  documento: "Documento",
  apostila: "Apostila",
  artigo: "Artigo",
  roteiro: "Roteiro",
  plano_de_ensino: "Plano de ensino",
};

export function KindBadge({ kind, className }: { kind: MaterialKind; className?: string }) {
  return (
    <span
      className={cn(
        "border-line text-ink-muted inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[0.7rem] font-medium",
        className,
      )}
    >
      {kindLabels[kind]}
    </span>
  );
}

/** "Usado em 2 disciplinas" — the phrase that makes the shared model visible. */
export function SharedBadge({ count, className }: { count: number; className?: string }) {
  if (count < 2) return null;
  return (
    <span
      className={cn(
        "bg-accent-soft text-accent inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      Usado em {count} disciplinas
    </span>
  );
}

export function ReviewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-danger-soft text-danger inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <FileWarning className="size-3" aria-hidden="true" />
      Revisar
    </span>
  );
}
