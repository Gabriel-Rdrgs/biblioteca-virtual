"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, FileText, Home, Layers, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Início", icon: Home, exact: true },
  { href: "/livros", label: "Estante", icon: BookMarked, exact: false },
  { href: "/disciplinas", label: "Matérias", icon: Layers, exact: false },
  { href: "/planos-de-ensino", label: "Planos", icon: FileText, exact: false },
  { href: "/busca", label: "Buscar", icon: Search, exact: false },
] as const;

/** Bottom bar on phones — the primary destinations stay one tap away. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="border-line bg-canvas/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="glass mx-auto flex max-w-lg items-stretch rounded-full px-1">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-2 text-[0.66rem] font-medium transition-colors",
                  active ? "text-primary" : "text-ink-faint hover:text-ink",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
