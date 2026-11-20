import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { SHARED_DECK_LIMITS, type SharedDeckRecord } from "@/lib/domain/flashcard-types";
import { slugify } from "@/lib/domain/normalize";
import { readSharedStore, updateSharedStore } from "@/lib/flashcard-store";
import { getDisciplines } from "@/lib/repository";

/**
 * Publicar um baralho para a turma.
 *
 * Não há conta individual, então não há "dono" no sentido de login. Quem
 * publica recebe um segredo que fica guardado no aparelho; só ele edita ou
 * retira o baralho. O servidor guarda apenas o hash. Se o aparelho for
 * perdido, o admin ainda oculta ou apaga pelo painel.
 *
 * Os limites abaixo não são sobre confiança, são sobre tamanho: o arquivo
 * inteiro é lido a cada página, e um baralho de dez mil cartões deixaria a
 * lista lenta para todo mundo.
 */

const LIMITS = SHARED_DECK_LIMITS;

const cardSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]{1,40}$/i)
    .optional(),
  front: z.string().trim().min(1, "frente vazia").max(LIMITS.front),
  back: z.string().trim().min(1, "verso vazio").max(LIMITS.back),
});

export const sharedDeckInputSchema = z.object({
  title: z.string().trim().min(3, "título curto demais").max(LIMITS.title),
  description: z.string().trim().max(LIMITS.description).default(""),
  disciplineId: z.string().min(1),
  author: z.string().trim().max(LIMITS.author).optional(),
  cards: z.array(cardSchema).min(1, "o baralho precisa de ao menos um cartão").max(LIMITS.cardsPerDeck),
});

export type SharedDeckInput = z.infer<typeof sharedDeckInputSchema>;

export class SharedDeckError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function tokenMatches(token: string | null | undefined, hash: string): boolean {
  if (!token) return false;
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

async function checkDiscipline(id: string): Promise<void> {
  const disciplines = await getDisciplines();
  if (!disciplines.some((d) => d.id === id)) {
    throw new SharedDeckError(`Matéria desconhecida: ${id}.`, 400);
  }
}

function normaliseCards(cards: SharedDeckInput["cards"]): SharedDeckRecord["cards"] {
  const seen = new Set<string>();
  return cards.map((card, i) => {
    let id = card.id ?? `c${i + 1}`;
    // Ids repetidos fariam dois cartões dividirem o mesmo progresso.
    while (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    return { id, front: card.front, back: card.back };
  });
}

export async function publishSharedDeck(
  input: SharedDeckInput,
  now = new Date(),
): Promise<{ id: string; token: string }> {
  await checkDiscipline(input.disciplineId);
  const token = randomBytes(24).toString("base64url");
  const at = now.toISOString();
  let id = "";

  await updateSharedStore((store) => {
    if (store.decks.length >= LIMITS.decks) {
      throw new SharedDeckError(
        "A turma chegou ao limite de baralhos publicados. Peça ao admin para arquivar os antigos.",
        409,
      );
    }
    const base =
      slugify(input.title)
        .slice(0, 48)
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+$/, "") || "baralho";
    id = `${base}-${randomBytes(3).toString("hex")}`;
    const record: SharedDeckRecord = {
      id,
      title: input.title,
      description: input.description,
      disciplineId: input.disciplineId,
      ...(input.author ? { author: input.author } : {}),
      cards: normaliseCards(input.cards),
      createdAt: at,
      updatedAt: at,
      visibility: "visivel",
      tokenHash: hashToken(token),
    };
    return { ...store, decks: [...store.decks, record] };
  });

  return { id, token };
}

export async function updateSharedDeck(
  id: string,
  token: string | null,
  input: SharedDeckInput,
  now = new Date(),
): Promise<void> {
  await checkDiscipline(input.disciplineId);
  await updateSharedStore((store) => {
    const current = store.decks.find((d) => d.id === id);
    if (!current) throw new SharedDeckError("Baralho não encontrado.", 404);
    if (!tokenMatches(token, current.tokenHash)) {
      throw new SharedDeckError("Só o aparelho que publicou este baralho pode alterá-lo.", 403);
    }
    const next: SharedDeckRecord = {
      ...current,
      title: input.title,
      description: input.description,
      disciplineId: input.disciplineId,
      cards: normaliseCards(input.cards),
      updatedAt: now.toISOString(),
    };
    const { author: _omit, ...withoutAuthor } = next;
    const record = input.author ? { ...withoutAuthor, author: input.author } : withoutAuthor;
    return { ...store, decks: store.decks.map((d) => (d.id === id ? record : d)) };
  });
}

export async function withdrawSharedDeck(id: string, token: string | null): Promise<void> {
  await updateSharedStore((store) => {
    const current = store.decks.find((d) => d.id === id);
    if (!current) throw new SharedDeckError("Baralho não encontrado.", 404);
    if (!tokenMatches(token, current.tokenHash)) {
      throw new SharedDeckError("Só o aparelho que publicou este baralho pode retirá-lo.", 403);
    }
    return { ...store, decks: store.decks.filter((d) => d.id !== id) };
  });
}

/* ---------- admin ---------- */

export interface SharedDeckListing {
  readonly id: string;
  readonly title: string;
  readonly disciplineId: string;
  readonly author?: string;
  readonly cards: number;
  readonly updatedAt: string;
  readonly visibility: "visivel" | "oculto";
}

export async function listSharedDecksForAdmin(): Promise<SharedDeckListing[]> {
  const store = await readSharedStore();
  return store.decks
    .map((d) => ({
      id: d.id,
      title: d.title,
      disciplineId: d.disciplineId,
      ...(d.author ? { author: d.author } : {}),
      cards: d.cards.length,
      updatedAt: d.updatedAt,
      visibility: d.visibility,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function setSharedDeckVisibility(
  id: string,
  visibility: "visivel" | "oculto",
): Promise<void> {
  await updateSharedStore((store) => {
    if (!store.decks.some((d) => d.id === id)) {
      throw new SharedDeckError("Baralho não encontrado.", 404);
    }
    return {
      ...store,
      decks: store.decks.map((d) => (d.id === id ? { ...d, visibility } : d)),
    };
  });
}

export async function deleteSharedDeckAsAdmin(id: string): Promise<void> {
  await updateSharedStore((store) => {
    if (!store.decks.some((d) => d.id === id)) {
      throw new SharedDeckError("Baralho não encontrado.", 404);
    }
    return { ...store, decks: store.decks.filter((d) => d.id !== id) };
  });
}
