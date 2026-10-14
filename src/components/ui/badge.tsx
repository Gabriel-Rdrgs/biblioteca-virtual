import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Etiquetas: uma informação curta e inerte, nunca clicável.
 *
 * A separação importa porque etiqueta e botão vinham se parecendo demais —
 * ambos pílulas com fundo cheio. Aqui a etiqueta é sempre menor, mais leve
 * e sem sombra, para não convidar ao toque.
 */

type Tom = "neutro" | "primario" | "acento" | "sucesso" | "perigo" | "contorno";

const tons: Record<Tom, string> = {
  neutro: "glass-strong text-ink-muted",
  primario: "bg-primary text-on-primary",
  acento: "bg-accent-soft text-accent",
  sucesso: "bg-sage-soft text-sage",
  perigo: "bg-danger-soft text-danger",
  contorno: "border-line text-ink-muted border",
};

export function Badge({
  tom = "neutro",
  className,
  children,
}: {
  readonly tom?: Tom;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "text-micro inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold whitespace-nowrap",
        tons[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}
