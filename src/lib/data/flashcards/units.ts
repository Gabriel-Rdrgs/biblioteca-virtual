/**
 * A ordem em que os baralhos se estudam, matéria por matéria.
 *
 * Os baralhos chegaram de lugares diferentes (roteiros da turma, banco de
 * questões, colegas) e, empilhados pela origem, pareciam jogados. Aqui cada
 * matéria ganha unidades na ordem do plano de ensino — em HA I, sinais
 * vitais antes da ectoscopia, a ectoscopia antes de cabeça e pescoço — e,
 * dentro de cada unidade, a ordem em que o assunto se constrói.
 *
 * Baralho que não estiver listado ainda aparece, no fim da matéria: esquecer
 * de cadastrar aqui nunca esconde nada.
 */

export interface DeckUnit {
  readonly title: string;
  /** Uma linha: o que a unidade cobre, ou de onde vem. */
  readonly note?: string;
  readonly slugs: readonly string[];
}

export const deckUnits: Readonly<Record<string, readonly DeckUnit[]>> = {
  "ha-1": [
    {
      title: "Sinais vitais",
      note: "Unidade II do plano — a estação de PA do OSCE.",
      slugs: ["semio-pressao-arterial"],
    },
    {
      title: "Ectoscopia",
      note: "Unidade II — fácies e lesões elementares da pele.",
      slugs: ["semio-facies", "pele-lesoes-primarias", "pele-lesoes-secundarias"],
    },
    {
      title: "Cabeça e pescoço",
      note: "Unidade III — crânio e linfonodos.",
      slugs: ["semio-cranio", "semio-linfonodos"],
    },
  ],
  "mac-1": [
    {
      title: "Membros superiores",
      note: "Moore, capítulo 6 — do osso à articulação.",
      slugs: [
        "mmss-ossos",
        "mmss-veias-e-nervos-cutaneos",
        "mmss-ombro-e-plexo-braquial",
        "mmss-braco-e-antebraco",
        "mmss-mao",
        "mmss-articulacoes",
      ],
    },
    {
      title: "Questões do banco",
      note: "Cada questão vira cartão: o caso na frente, o gabarito no verso.",
      slugs: ["banco-anatomia", "banco-parasitologia"],
    },
  ],
  "aes-3": [
    {
      title: "Vírus",
      note: "Tortora, capítulo 13 — da estrutura aos antivirais.",
      slugs: [
        "virus-estrutura-e-genetica",
        "virus-infeccao-replicacao-e-evolucao",
        "virus-elisa-e-western-blot",
        "virus-farmacos-antivirais",
        "virus-agentes-acelulares",
      ],
    },
  ],
  "aes-2": [
    {
      title: "Questões do banco",
      note: "Cada questão vira cartão: o caso na frente, o gabarito no verso.",
      slugs: ["banco-biologia-celular"],
    },
  ],
  "ic-1": [
    {
      title: "Questões do banco",
      note: "Cada questão vira cartão: o caso na frente, o gabarito no verso.",
      slugs: ["banco-iniciacao-cientifica"],
    },
  ],
};

export interface OrderedUnit<T> {
  readonly title: string;
  readonly note?: string;
  readonly decks: readonly T[];
}

/**
 * Arruma os baralhos de uma matéria nas unidades acima. O que sobrar vai
 * para "Outros baralhos" (oficiais) e "Da turma" (publicados por colegas),
 * nessa ordem.
 */
export function orderDecks<T extends { slug: string; origin: string }>(
  disciplineId: string,
  decks: readonly T[],
): OrderedUnit<T>[] {
  const units = deckUnits[disciplineId] ?? [];
  const bySlug = new Map(decks.map((deck) => [deck.slug, deck]));
  const used = new Set<string>();
  const out: OrderedUnit<T>[] = [];

  for (const unit of units) {
    const found = unit.slugs.flatMap((slug) => {
      const deck = bySlug.get(slug);
      if (!deck) return [];
      used.add(slug);
      return [deck];
    });
    if (found.length > 0) {
      out.push({ title: unit.title, ...(unit.note ? { note: unit.note } : {}), decks: found });
    }
  }

  const rest = decks.filter((deck) => !used.has(deck.slug));
  const official = rest.filter((deck) => deck.origin !== "turma" && deck.origin !== "meu");
  const shared = rest.filter((deck) => deck.origin === "turma");
  if (official.length > 0) out.push({ title: "Outros baralhos", decks: official });
  if (shared.length > 0) {
    out.push({ title: "Da turma", note: "Publicados por colegas.", decks: shared });
  }
  return out;
}
