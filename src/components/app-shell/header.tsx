"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { AtlasMark } from "@/components/ui/atlas-mark";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/livros", label: "Livros" },
  { href: "/disciplinas", label: "Disciplinas" },
  { href: "/planos-de-ensino", label: "Planos de ensino" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-line bg-canvas/85 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-ink hover:text-primary flex shrink-0 items-center gap-2.5 transition-colors"
        >
          <AtlasMark className="text-primary size-7" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-tight">Atlas</span>
            <span className="text-ink-faint hidden text-[0.62rem] tracking-[0.16em] uppercase sm:block">
              Biblioteca Médica
            </span>
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/busca"
            className="border-line text-ink-muted hover:border-line-strong hover:text-ink inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors"
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden lg:inline">Buscar no acervo</span>
            <span className="sr-only lg:hidden">Buscar no acervo</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
