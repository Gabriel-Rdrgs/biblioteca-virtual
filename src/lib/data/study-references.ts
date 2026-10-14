/**
 * Onde estudar cada eixo: o livro, a seção e a página.
 *
 * Nada aqui foi inventado. As páginas de Parasitologia Contemporânea vêm
 * do sumário navegável do próprio PDF; as do Moore, do índice de seções
 * extraído do arquivo — o livro não traz sumário navegável, e o número
 * impresso na página não coincide com o do PDF, então a página citada é
 * sempre a do arquivo, que é a que o leitor abre.
 *
 * `page` é a página do PDF. Quando a edição do arquivo mudar, estes
 * números mudam junto: por isso cada entrada diz de onde saiu.
 */

export interface StudyReference {
  /** Eixo do banco de questões a que esta leitura responde. */
  readonly axisId: string;
  readonly areaId: string;
  /** Id do livro no catálogo. */
  readonly bookId: string;
  /** Como a seção se chama no livro. */
  readonly section: string;
  /** Página do PDF, não a impressa. */
  readonly page: number;
  /** Capítulo, quando o livro os numera. */
  readonly chapter?: string;
}

const MOORE = "moore-anatomia-clinica";
const FERREIRA = "parasitologia-contemporanea";

export const studyReferences: readonly StudyReference[] = [
  // ------------------------------------------------------------ anatomia
  {
    axisId: "referenciais",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Terminologia anatômica",
    page: 36,
  },
  {
    axisId: "referenciais",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Posição anatômica e planos anatômicos",
    page: 37,
  },
  {
    axisId: "osteologia-geral",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Sistema esquelético",
    page: 53,
  },
  {
    axisId: "osteologia-geral",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Classificação dos ossos",
    page: 55,
  },
  {
    axisId: "osteologia-geral",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Desenvolvimento ósseo",
    page: 58,
  },
  {
    axisId: "cranio",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Crânio",
    page: 1126,
    chapter: "8 — Cabeça",
  },
  {
    axisId: "cranio",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Vista lateral do crânio",
    page: 1133,
    chapter: "8 — Cabeça",
  },
  {
    axisId: "contracao",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Tecido muscular e sistema muscular",
    page: 68,
  },
  {
    axisId: "contracao",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Contração dos músculos",
    page: 72,
  },
  {
    axisId: "miologia",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Músculos da face e do couro cabeludo",
    page: 1155,
    chapter: "8 — Cabeça",
  },
  {
    axisId: "miologia",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Músculos da mastigação",
    page: 1242,
    chapter: "8 — Cabeça",
  },
  {
    axisId: "miologia",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Região esternocleidomastóidea",
    page: 1332,
    chapter: "9 — Pescoço",
  },
  {
    axisId: "coluna",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Considerações gerais sobre o dorso e a coluna vertebral",
    page: 128,
    chapter: "2 — Dorso",
  },
  {
    axisId: "coluna",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Vértebras",
    page: 132,
    chapter: "2 — Dorso",
  },
  {
    axisId: "dorso",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Músculos do dorso",
    page: 184,
    chapter: "2 — Dorso",
  },
  {
    axisId: "dorso",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Músculos próprios do dorso",
    page: 185,
    chapter: "2 — Dorso",
  },
  {
    axisId: "parede-abdominal",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Parede anterolateral do abdome",
    page: 587,
    chapter: "5 — Abdome",
  },
  {
    axisId: "parede-abdominal",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Bainha do músculo reto do abdome, linha alba e umbigo",
    page: 594,
    chapter: "5 — Abdome",
  },
  {
    axisId: "assoalho-pelvico",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Assoalho pélvico",
    page: 786,
    chapter: "6 — Pelve e Períneo",
  },
  {
    axisId: "assoalho-pelvico",
    areaId: "anatomia",
    bookId: MOORE,
    section: "Períneo",
    page: 859,
    chapter: "6 — Pelve e Períneo",
  },

  // ------------------------------------------------------- parasitologia
  {
    axisId: "introducao",
    areaId: "parasitologia",
    bookId: FERREIRA,
    section: "Introdução à Parasitologia",
    page: 27,
    chapter: "1",
  },
  {
    axisId: "giardia-amebiase",
    areaId: "parasitologia",
    bookId: FERREIRA,
    section: "Os Protozoários Intestinais Clássicos",
    page: 329,
    chapter: "8",
  },
  {
    axisId: "malaria-chagas",
    areaId: "parasitologia",
    bookId: FERREIRA,
    section: "Os Plasmódios e a Malária",
    page: 88,
    chapter: "3",
  },
  {
    axisId: "malaria-chagas",
    areaId: "parasitologia",
    bookId: FERREIRA,
    section: "Trypanosoma cruzi e a Doença de Chagas",
    page: 188,
    chapter: "5",
  },
  {
    axisId: "leishmania-toxo",
    areaId: "parasitologia",
    bookId: FERREIRA,
    section: "Toxoplasma gondii e a Toxoplasmose",
    page: 147,
    chapter: "4",
  },
  {
    axisId: "leishmania-toxo",
    areaId: "parasitologia",
    bookId: FERREIRA,
    section: "O Gênero Leishmania e as Leishmanioses",
    page: 291,
    chapter: "7",
  },
  {
    axisId: "tricomoniase",
    areaId: "parasitologia",
    bookId: FERREIRA,
    section: "Trichomonas vaginalis e a Tricomoníase",
    page: 487,
    chapter: "12",
  },
  {
    axisId: "tenia",
    areaId: "parasitologia",
    bookId: FERREIRA,
    section: "Os Cestoides",
    page: 751,
    chapter: "18",
  },
  {
    axisId: "esquistossomose",
    areaId: "parasitologia",
    bookId: FERREIRA,
    section: "Trematódeos | Schistosoma mansoni e Fasciola hepatica",
    page: 662,
    chapter: "16",
  },
  {
    axisId: "larva-migrans",
    areaId: "parasitologia",
    bookId: FERREIRA,
    section: "Larva migrans Visceral e Cutânea",
    page: 580,
    chapter: "14",
  },
  {
    axisId: "ascaris-enterobius",
    areaId: "parasitologia",
    bookId: FERREIRA,
    section: "Os Nematódeos Intestinais",
    page: 509,
    chapter: "13",
  },
  {
    axisId: "ancilostoma-strongyloides",
    areaId: "parasitologia",
    bookId: FERREIRA,
    section: "Os Nematódeos Intestinais",
    page: 509,
    chapter: "13",
  },
  {
    axisId: "ancilostoma-strongyloides",
    areaId: "parasitologia",
    bookId: FERREIRA,
    section: "Diagnóstico Parasitológico",
    page: 899,
    chapter: "20",
  },
];

/** As leituras de um eixo, na ordem em que estão aqui. */
export function referencesForAxis(axisId: string): readonly StudyReference[] {
  return studyReferences.filter((reference) => reference.axisId === axisId);
}

/** O link que abre o livro na página certa. */
export function readerHref(reference: StudyReference): string {
  return `/livros/${reference.bookId}/ler?pagina=${reference.page}`;
}
