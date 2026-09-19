"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "atlas-favoritos";

function readFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Favourites live in localStorage for now — there is no account system yet.
 * When authentication arrives this component keeps its shape and the storage
 * call moves behind the repository.
 */
export function FavoriteButton({ bookId, title }: { bookId: string; title: string }) {
  const [favorite, setFavorite] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavorite(readFavorites().includes(bookId));
    setReady(true);
  }, [bookId]);

  const toggle = () => {
    const next = !favorite;
    setFavorite(next);
    const current = readFavorites().filter((id) => id !== bookId);
    if (next) current.push(bookId);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Storage unavailable (private mode): the button still reflects the
      // click for this session.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!ready}
      aria-pressed={favorite}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-medium transition-colors",
        favorite
          ? "border-accent bg-accent-soft text-accent"
          : "glass text-ink-muted hover:glass-strong hover:text-ink border-transparent",
      )}
    >
      <Bookmark className={cn("size-4", favorite && "fill-current")} aria-hidden="true" />
      {favorite ? "Salvo" : "Salvar"}
      <span className="sr-only">
        {favorite ? `Remover ${title} dos salvos` : `Salvar ${title}`}
      </span>
    </button>
  );
}
