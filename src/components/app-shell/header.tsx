"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { AtlasMark } from "@/components/ui/atlas-mark";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/livros", label: "Estante" },
  { href: "/disciplinas", label: "Matérias" },
  { href: "/planos-de-ensino", label: "Planos" },
] as const;

/** A floating glass bar rather than a full-width strip. */
export function Header({ gated }: { gated: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-3 z-40 px-3 sm:top-4 sm:px-6">
      <div className="glass mx-auto flex h-14 max-w-6xl items-center gap-2 rounded-full pr-2 pl-4">
        <Link
          href="/"
          className="text-ink hover:text-primary flex shrink-0 items-center gap-2 transition-colors"
        >
          <AtlasMark className="text-primary size-6" />
          <span className="font-display text-lg font-semibold tracking-tight">Atlas</span>
        </Link>

        <nav aria-label="Navegação principal" className="ml-3 hidden items-center gap-0.5 md:flex">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active ? "glass-strong text-primary" : "text-ink-muted hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/busca"
            className="text-ink-muted hover:glass-strong hover:text-ink inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm transition-colors"
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden lg:inline">Buscar</span>
            <span className="sr-only lg:hidden">Buscar</span>
          </Link>
          <ThemeToggle />
          {gated ? (
            <form method="post" action="/api/sair">
              <button
                type="submit"
                className="text-ink-muted hover:glass-strong hover:text-ink inline-flex size-9 items-center justify-center rounded-full transition-colors"
                aria-label="Sair da biblioteca"
                title="Sair"
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
