import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * O botão do Atlas.
 *
 * Antes deste arquivo havia 33 botões primários escritos à mão em 19
 * arquivos, iguais no espírito e diferentes no padding. As variantes abaixo
 * são exatamente as que já existiam na tela — o componente não inventa
 * aparência nova, só para de deixar cada tela decidir sozinha.
 */

type Variant = "primario" | "secundario" | "fantasma" | "perigo";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primario: "bg-primary text-on-primary hover:bg-primary-hover shadow-[var(--shadow-raise)]",
  secundario: "glass hover:glass-strong text-ink",
  fantasma: "text-ink-muted hover:glass-strong hover:text-ink",
  perigo: "bg-danger-soft text-danger hover:bg-danger hover:text-on-primary",
};

/**
 * Alvos de toque: mesmo o tamanho pequeno fica em 36px de altura, e os dois
 * maiores passam dos 44px que o dedo pede.
 */
const sizes: Record<Size, string> = {
  sm: "min-h-9 px-4 py-2 text-sm",
  md: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-sm",
};

interface Common {
  readonly variant?: Variant;
  readonly size?: Size;
  /** Ocupa a linha inteira — típico de formulário no celular. */
  readonly block?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

type ButtonProps = Common & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;
type AnchorProps = Common & { readonly href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "className" | "children" | "href"
  >;

function classes({
  variant = "primario",
  size = "md",
  block,
  className,
}: Omit<Common, "children">) {
  return cn(base, variants[variant], sizes[size], block && "w-full", className);
}

export function Button({ variant, size, block, className, children, ...rest }: ButtonProps) {
  return (
    <button className={classes({ variant, size, block, className })} {...rest}>
      {children}
    </button>
  );
}

/** Mesma aparência, para quando a ação é ir a algum lugar. */
export function ButtonLink({
  variant,
  size,
  block,
  className,
  children,
  href,
  ...rest
}: AnchorProps) {
  return (
    <Link href={href} className={classes({ variant, size, block, className })} {...rest}>
      {children}
    </Link>
  );
}

/** Para endereços que não são rota do app: download, fonte externa. */
export function ButtonAnchor({
  variant,
  size,
  block,
  className,
  children,
  ...rest
}: Common & Omit<ComponentPropsWithoutRef<"a">, "className" | "children">) {
  return (
    <a className={classes({ variant, size, block, className })} {...rest}>
      {children}
    </a>
  );
}

/** Botão só de ícone: quadrado, com rótulo acessível obrigatório. */
export function IconButton({
  label,
  size = "md",
  variant = "fantasma",
  className,
  children,
  ...rest
}: Omit<Common, "block"> & { readonly label: string } & Omit<
    ComponentPropsWithoutRef<"button">,
    "className" | "children"
  >) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        base,
        variants[variant],
        size === "sm" ? "size-9" : "size-11",
        "p-0",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Pílula de seleção: liga/desliga uma opção e fica marcada quando ativa.
 *
 * Não é botão nem etiqueta — é um terceiro estado, e vinha sendo refeito à
 * mão em três telas (escolher área do treino, filtrar a revisão, marcar a
 * alternativa). `aria-pressed` é o que conta a um leitor de tela que isto
 * alterna, em vez de navegar.
 */
export function ToggleChip({
  pressed,
  className,
  children,
  ...rest
}: { readonly pressed: boolean } & Omit<
  ComponentPropsWithoutRef<"button">,
  "className" | "children" | "aria-pressed"
> & { readonly className?: string; readonly children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "min-h-9 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
        pressed ? "bg-primary text-on-primary" : "glass-strong text-ink-muted hover:text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
