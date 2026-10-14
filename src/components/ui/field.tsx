import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Campos de formulário.
 *
 * Estavam em `components/admin/`, como se formulário fosse assunto do
 * painel. Com conta individual e flashcards, o aluno também escreve — então
 * eles sobem para a camada comum, com altura de toque e foco visíveis.
 */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  readonly label: string;
  readonly htmlFor: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={`${htmlFor}-dica`} className="text-ink-faint mt-0.5 text-xs">
          {hint}
        </p>
      ) : null}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${htmlFor}-erro`} role="alert" className="text-danger mt-1.5 text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** 44px de altura: o mínimo confortável para o dedo. */
export const inputClass =
  "border-line bg-surface focus:border-primary min-h-11 w-full rounded-control border px-3 py-2 text-sm";

export function Input({
  className,
  ...rest
}: Omit<ComponentPropsWithoutRef<"input">, "className"> & { readonly className?: string }) {
  return <input className={cn(inputClass, className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: Omit<ComponentPropsWithoutRef<"textarea">, "className"> & { readonly className?: string }) {
  return <textarea className={cn(inputClass, "min-h-24 leading-relaxed", className)} {...rest} />;
}

export function Select({
  className,
  children,
  ...rest
}: Omit<ComponentPropsWithoutRef<"select">, "className"> & { readonly className?: string }) {
  return (
    <select className={cn(inputClass, className)} {...rest}>
      {children}
    </select>
  );
}

/** Recado curto depois de uma ação: erro, sucesso ou ressalva. */
export function Notice({
  tone,
  children,
  className,
}: {
  readonly tone: "erro" | "ok" | "aviso";
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <p
      role={tone === "erro" ? "alert" : "status"}
      className={cn(
        "rounded-control border px-3 py-2 text-sm",
        tone === "erro" && "border-danger/30 bg-danger-soft text-danger",
        tone === "ok" && "border-sage/40 bg-sage-soft text-sage",
        tone === "aviso" && "border-accent/40 bg-accent-soft text-accent",
        className,
      )}
    >
      {children}
    </p>
  );
}
