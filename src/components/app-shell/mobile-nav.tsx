"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * A barra de baixo, no celular.
 *
 * Lê os mesmos destinos do cabeçalho, para as duas navegações não voltarem a
 * divergir. Antes havia dois fundos empilhados aqui — uma faixa opaca com
 * borda e, por cima, a pílula de vidro; fica só a pílula.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="glass glass-bar mx-auto mb-2 flex max-w-lg items-stretch rounded-full px-1">
        {navItems.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-micro flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-2 font-medium transition-colors",
                  active ? "text-primary" : "text-ink-muted hover:text-ink",
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
