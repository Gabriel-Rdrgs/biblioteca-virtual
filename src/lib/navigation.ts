import { BookMarked, CalendarDays, Home, Layers, PencilRuler, type LucideIcon } from "lucide-react";

/**
 * Os destinos do Atlas, em um lugar só.
 *
 * Antes havia duas navegações que discordavam: o cabeçalho do desktop levava
 * a cinco lugares e a barra do celular a outros cinco. Calendário e Planos
 * simplesmente não existiam no celular — e o calendário é a coisa mais
 * sensível ao tempo do produto. Pior: em /calendario nenhum item ficava
 * marcado, então não dava para saber onde se estava.
 *
 * Agora são cinco destinos iguais nos dois tamanhos. Busca não está aqui de
 * propósito: busca é ação, não lugar, e fica no cabeçalho.
 */

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
  /** Só a home casa de forma exata; as outras valem para as suas subpáginas. */
  readonly exact?: boolean;
  /** Rotas que pertencem a este destino, mesmo com outro endereço. */
  readonly alsoMatches?: readonly string[];
}

export const navItems: readonly NavItem[] = [
  { href: "/", label: "Início", icon: Home, exact: true },
  { href: "/livros", label: "Estante", icon: BookMarked },
  {
    href: "/disciplinas",
    label: "Matérias",
    icon: Layers,
    // O plano de ensino é parte da matéria, não um destino à parte.
    alsoMatches: ["/planos-de-ensino"],
  },
  {
    href: "/estudar",
    label: "Estudar",
    icon: PencilRuler,
    alsoMatches: ["/simulados", "/progresso"],
  },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
];

export function isActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  const prefixes = [item.href, ...(item.alsoMatches ?? [])];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
