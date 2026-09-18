import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "BICKLEY, Lynn S." -> "Bickley". Used where space is tight. */
export function surnameOf(author: string): string {
  const surname = author.split(",")[0]?.trim() ?? author;
  return surname
    .split(/\s+/)
    .map((part) =>
      part.length > 2 && part === part.toUpperCase() ? part[0] + part.slice(1).toLowerCase() : part,
    )
    .join(" ");
}

/** "Bickley, Szilagyi e mais 1" — never a bare "et al." in the UI. */
export function formatAuthors(authors: readonly string[], max = 2): string {
  const named = authors.filter((a) => a !== "et al.");
  const hasEtAl = authors.length !== named.length;

  if (named.length === 0) return "Autoria não informada";

  const shown = named.slice(0, max).map(surnameOf);
  const remaining = named.length - shown.length + (hasEtAl ? 1 : 0);

  if (remaining <= 0) {
    return shown.length === 1
      ? (shown[0] as string)
      : `${shown.slice(0, -1).join(", ")} e ${shown[shown.length - 1]}`;
  }

  return `${shown.join(", ")} e mais ${remaining}`;
}
