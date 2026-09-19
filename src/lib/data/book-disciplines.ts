import type { BookDisciplineLink } from "@/lib/domain/types";

/**
 * Book-to-discipline links, one row per appearance in a teaching plan.
 *
 * Four titles appear in two plans each — Gartner, Mattos, Faintuch and
 * Gusso. They have a single Book record and two links, which is what lets
 * the catalogue say "bibliografia básica aqui, complementar ali" instead
 * of showing the same book twice.
 */
export const bookDisciplines: readonly BookDisciplineLink[] = [
  // ---------------------------------------------------------------- MAC I
  {
    bookId: "moore-anatomia-clinica",
    disciplineId: "mac-1",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "gartner-tratado-de-histologia",
    disciplineId: "mac-1",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "parasitologia-contemporanea",
    disciplineId: "mac-1",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "netter-anatomia-clinica",
    disciplineId: "mac-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "cinesiologia-clinica-e-anatomia",
    disciplineId: "mac-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "embriologia-basica",
    disciplineId: "mac-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "rey-parasitologia",
    disciplineId: "mac-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "abrahamsohn-histologia",
    disciplineId: "mac-1",
    bibliographyType: "complementar",
    priority: 2,
  },

  // ---------------------------------------------------------------- AES 2
  {
    bookId: "biologia-molecular-da-celula",
    disciplineId: "aes-2",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "biologia-celular-e-molecular",
    disciplineId: "aes-2",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "gartner-tratado-de-histologia",
    disciplineId: "aes-2",
    bibliographyType: "basica",
    priority: 1,
    notes: "Também é bibliografia básica em Morfofuncional Aplicado à Clínica I.",
  },
  { bookId: "a-celula", disciplineId: "aes-2", bibliographyType: "complementar", priority: 2 },
  {
    bookId: "biologia-do-desenvolvimento",
    disciplineId: "aes-2",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "introducao-a-genetica",
    disciplineId: "aes-2",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "guyton-hall-fisiologia-medica",
    disciplineId: "aes-2",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "biologia-de-campbell",
    disciplineId: "aes-2",
    bibliographyType: "complementar",
    priority: 2,
  },

  // ----------------------------------------------------------------- HA I
  {
    bookId: "bates-propedeutica-medica-essencial",
    disciplineId: "ha-1",
    bibliographyType: "basica",
    priority: 1,
  },
  { bookId: "porto-exame-clinico", disciplineId: "ha-1", bibliographyType: "basica", priority: 1 },
  {
    bookId: "rocco-semiologia-medica",
    disciplineId: "ha-1",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "biosseguranca-e-controle-de-infeccoes",
    disciplineId: "ha-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "martins-semiologia-clinica",
    disciplineId: "ha-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "semiologia-do-adulto",
    disciplineId: "ha-1",
    bibliographyType: "complementar",
    priority: 2,
    notes: "É bibliografia básica em Humanidades Médicas I.",
  },
  {
    bookId: "porto-semiologia-medica",
    disciplineId: "ha-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "suporte-basico-a-vida",
    disciplineId: "ha-1",
    bibliographyType: "complementar",
    priority: 2,
  },

  // ----------------------------------------------------------------- IC I
  {
    bookId: "etica-em-pesquisa",
    disciplineId: "ic-1",
    bibliographyType: "basica",
    priority: 1,
    notes: "Também aparece como complementar em Humanidades Médicas I.",
  },
  {
    bookId: "saude-baseada-em-evidencias",
    disciplineId: "ic-1",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "metodologia-cientifica-area-da-saude",
    disciplineId: "ic-1",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "bioetica-direito-e-medicina",
    disciplineId: "ic-1",
    bibliographyType: "basica_virtual",
    priority: 2,
  },
  {
    bookId: "medicina-baseada-em-evidencias",
    disciplineId: "ic-1",
    bibliographyType: "basica_virtual",
    priority: 2,
  },
  {
    bookId: "fundamentos-de-metodologia-cientifica",
    disciplineId: "ic-1",
    bibliographyType: "basica_virtual",
    priority: 2,
  },
  {
    bookId: "tecnicas-de-pesquisa",
    disciplineId: "ic-1",
    bibliographyType: "basica_virtual",
    priority: 2,
  },
  {
    bookId: "redacao-de-artigos-cientificos",
    disciplineId: "ic-1",
    bibliographyType: "basica_virtual",
    priority: 2,
  },

  // -------------------------------------------------------------- IESCG I
  {
    bookId: "tratado-medicina-familia-comunidade",
    disciplineId: "iescg-1",
    bibliographyType: "basica",
    priority: 1,
    notes: "Também aparece como complementar em Humanidades Médicas I.",
  },
  {
    bookId: "manual-acm-de-terapeutica",
    disciplineId: "iescg-1",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "clinica-medica-na-pratica-diaria",
    disciplineId: "iescg-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "atencao-a-saude-de-populacoes-vulneraveis",
    disciplineId: "iescg-1",
    bibliographyType: "complementar",
    priority: 2,
    notes: "Repetida no plano, também sob “Outras Referências”.",
  },
  {
    bookId: "epidemiologia-basica",
    disciplineId: "iescg-1",
    bibliographyType: "outras_referencias",
    priority: 3,
  },
  {
    bookId: "sus-esquematizado",
    disciplineId: "iescg-1",
    bibliographyType: "outras_referencias",
    priority: 3,
  },
  {
    bookId: "sociologia-da-saude",
    disciplineId: "iescg-1",
    bibliographyType: "outras_referencias",
    priority: 3,
  },
  {
    bookId: "direito-a-diversidade",
    disciplineId: "iescg-1",
    bibliographyType: "basica_virtual",
    priority: 2,
  },
  {
    bookId: "historia-e-cultura-afro-brasileira",
    disciplineId: "iescg-1",
    bibliographyType: "basica_virtual",
    priority: 2,
  },
  {
    bookId: "processos-normativos-da-familia",
    disciplineId: "iescg-1",
    bibliographyType: "basica_virtual",
    priority: 2,
  },
  {
    bookId: "manual-mcwhinney",
    disciplineId: "iescg-1",
    bibliographyType: "basica_virtual",
    priority: 2,
  },
  {
    bookId: "medicina-ambulatorial",
    disciplineId: "iescg-1",
    bibliographyType: "basica_virtual",
    priority: 2,
  },

  // ----------------------------------------------------------------- HM I
  {
    bookId: "codigo-de-etica-medica-2019",
    disciplineId: "hm-1",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "semiologia-do-adulto",
    disciplineId: "hm-1",
    bibliographyType: "basica",
    priority: 1,
    notes: "É bibliografia complementar em Habilidades e Atitudes I.",
  },
  {
    bookId: "por-tras-do-jaleco-branco",
    disciplineId: "hm-1",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "lei-15378-2026-estatuto-direitos-do-paciente",
    disciplineId: "hm-1",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "resolucao-cne-ces-3-2025-dcn-medicina",
    disciplineId: "hm-1",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "etica-em-pesquisa",
    disciplineId: "hm-1",
    bibliographyType: "complementar",
    priority: 2,
    notes: "É bibliografia básica em Iniciação Científica I.",
  },
  {
    bookId: "tratado-medicina-familia-comunidade",
    disciplineId: "hm-1",
    bibliographyType: "complementar",
    priority: 2,
    notes: "É bibliografia básica em IESCG I.",
  },
  {
    bookId: "direito-a-diferenca-v2",
    disciplineId: "hm-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "nem-so-de-ciencia-se-faz-a-cura",
    disciplineId: "hm-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "medicina-centrada-na-pessoa",
    disciplineId: "hm-1",
    bibliographyType: "complementar",
    priority: 2,
  },

  // ---------------------------------------------------------------- AES 1
  {
    bookId: "historia-da-medicina-porter",
    disciplineId: "aes-1",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "saude-publica-bases-conceituais",
    disciplineId: "aes-1",
    bibliographyType: "basica",
    priority: 1,
  },
  {
    bookId: "principios-de-anatomia-e-fisiologia",
    disciplineId: "aes-1",
    bibliographyType: "basica",
    priority: 1,
    notes: "Repetida no plano, idêntica, sob “Bibliografia Básica Virtual”.",
  },
  {
    bookId: "as-novas-faces-da-medicina",
    disciplineId: "aes-1",
    bibliographyType: "basica_virtual",
    priority: 2,
  },
  {
    bookId: "uma-introducao-a-medicina-o-medico",
    disciplineId: "aes-1",
    bibliographyType: "basica_virtual",
    priority: 2,
  },
  {
    bookId: "codigo-de-etica-medica-2010",
    disciplineId: "aes-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  { bookId: "saude-global", disciplineId: "aes-1", bibliographyType: "complementar", priority: 2 },
  {
    bookId: "politica-nacional-de-saude",
    disciplineId: "aes-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "medicina-antiga",
    disciplineId: "aes-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "cartas-aos-estudantes-de-medicina",
    disciplineId: "aes-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  {
    bookId: "latest-in-healthcare-management",
    disciplineId: "aes-1",
    bibliographyType: "complementar",
    priority: 2,
  },
  // ------------------------------------------------- acervo da turma
  // Posted by the class; linked to the discipline they support, not cited by its plan.
  {
    bookId: "netter-atlas-de-anatomia-humana",
    disciplineId: "mac-1",
    bibliographyType: "acervo_da_turma",
    priority: 4,
  },
  {
    bookId: "netter-anatomia-para-colorir",
    disciplineId: "mac-1",
    bibliographyType: "acervo_da_turma",
    priority: 4,
  },
  {
    bookId: "netter-flash-cards-de-anatomia",
    disciplineId: "mac-1",
    bibliographyType: "acervo_da_turma",
    priority: 4,
  },
  {
    bookId: "parasitologia-humana-neves",
    disciplineId: "mac-1",
    bibliographyType: "acervo_da_turma",
    priority: 4,
  },
  {
    bookId: "fundamentos-de-genetica",
    disciplineId: "aes-2",
    bibliographyType: "acervo_da_turma",
    priority: 4,
  },
  {
    bookId: "genetica-humana-borges-osorio",
    disciplineId: "aes-2",
    bibliographyType: "acervo_da_turma",
    priority: 4,
  },
];
