import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * As superfícies do Atlas.
 *
 * Havia 39 cards de vidro montados à mão, cada um escolhendo o próprio raio
 * e o próprio respiro. São dois materiais de verdade no produto, e agora
 * eles têm nome:
 *
 * - `vidro`  — translúcido, flutua sobre o fundo. Painéis e destaques.
 * - `papel`  — sólido com borda. Linhas de lista e blocos densos, onde o
 *              vidro empilhado vira ruído.
 */

type Material = "vidro" | "papel" | "fundo";
type Raio = "card" | "panel" | "hero";
type Respiro = "nenhum" | "sm" | "md" | "lg";

const materiais: Record<Material, string> = {
  vidro: "glass",
  papel: "border-line bg-surface border",
  fundo: "bg-surface-sunken",
};

const raios: Record<Raio, string> = {
  card: "rounded-card",
  panel: "rounded-panel",
  hero: "rounded-hero",
};

const respiros: Record<Respiro, string> = {
  nenhum: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

interface CardProps {
  readonly material?: Material;
  readonly raio?: Raio;
  readonly respiro?: Respiro;
  readonly as?: ElementType;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Card({
  material = "vidro",
  raio = "panel",
  respiro = "md",
  as: Tag = "div",
  className,
  children,
  ...rest
}: CardProps & Omit<ComponentPropsWithoutRef<"div">, "className" | "children">) {
  return (
    <Tag className={cn(materiais[material], raios[raio], respiros[respiro], className)} {...rest}>
      {children}
    </Tag>
  );
}

/** A mesma superfície, quando o card inteiro é um link. */
export function CardLink({
  material = "vidro",
  raio = "panel",
  respiro = "md",
  className,
  children,
  href,
  ...rest
}: CardProps & { readonly href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "className" | "children" | "href"
  >) {
  return (
    <Link
      href={href}
      className={cn(
        materiais[material],
        raios[raio],
        respiros[respiro],
        "transition-colors",
        material === "vidro" ? "hover:glass-strong" : "hover:border-line-strong",
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
