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
 *
 * Em novembro de 2026 a ordem passou a ser a do uso: o Atlas deixou de ser
 * só estante, então Estudar vem logo depois do Início, a estante virou
 * Biblioteca (livros e resumos) e o calendário virou Agenda (datas e notas).
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
  {
    href: "/estudar",
    label: "Estudar",
    icon: PencilRuler,
    // Simulados, flashcards, os modos de treino e o desempenho são um lugar só.
    alsoMatches: ["/simulados", "/progresso", "/flashcards"],
  },
  {
    href: "/disciplinas",
    label: "Matérias",
    icon: Layers,
    // O plano de ensino é parte da matéria, não um destino à parte.
    alsoMatches: ["/planos-de-ensino"],
  },
  {
    href: "/livros",
    label: "Biblioteca",
    icon: BookMarked,
    // Livros e resumos são o material de leitura da turma.
    alsoMatches: ["/resumos"],
  },
  {
    href: "/calendario",
    label: "Agenda",
    icon: CalendarDays,
    // As datas e o que se tirou nelas.
    alsoMatches: ["/notas"],
  },
];

export function isActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  const prefixes = [item.href, ...(item.alsoMatches ?? [])];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
