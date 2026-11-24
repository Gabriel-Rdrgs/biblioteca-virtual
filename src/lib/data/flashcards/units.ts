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
      title: "Anatomia · orientação e ossos",
      note: "Referenciais, osteologia, crânio e coluna.",
      slugs: ["anat-referenciais", "anat-osteologia-geral", "anat-cranio", "anat-coluna"],
    },
    {
      title: "Anatomia · músculos",
      note: "Da contração aos músculos da cabeça, do dorso, do abdome e da pelve.",
      slugs: [
        "anat-contracao",
        "anat-miologia",
        "anat-dorso",
        "anat-parede-abdominal",
        "anat-assoalho-pelvico",
      ],
    },
    {
      title: "Parasitologia · protozoários",
      note: "Da introdução às espécies que caem em prova.",
      slugs: [
        "paras-introducao",
        "paras-giardia-amebiase",
        "paras-malaria-chagas",
        "paras-leishmania-toxo",
        "paras-tricomoniase",
      ],
    },
    {
      title: "Parasitologia · helmintos",
      note: "Cestódeos, trematódeos e nematódeos.",
      slugs: [
        "paras-tenia",
        "paras-esquistossomose",
        "paras-larva-migrans",
        "paras-ascaris-enterobius",
        "paras-ancilostoma-strongyloides",
      ],
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
      title: "Do DNA à proteína",
      note: "Genoma, replicação, transcrição, tradução e regulação.",
      slugs: ["bio-genoma", "bio-replicacao", "bio-transcricao-traducao", "bio-regulacao-epigenetica"],
    },
    {
      title: "A célula ao longo da vida",
      note: "Células-tronco, ciclo celular, neoplasia, senescência e apoptose.",
      slugs: ["bio-celulas-tronco", "bio-ciclo-neoplasia", "bio-senescencia-apoptose"],
    },
  ],
  "ic-1": [
    {
      title: "Ciência e evidência",
      note: "Do conhecimento científico à leitura crítica de um estudo.",
      slugs: ["ic-ciencia-conhecimento", "ic-mbe", "ic-tipos-pesquisa", "ic-busca-ia", "ic-vieses"],
    },
    {
      title: "Ética e integridade",
      note: "Pesquisa com seres humanos e com animais, e as regras do jogo.",
      slugs: ["ic-etica-humanos", "ic-animais", "ic-integridade"],
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
