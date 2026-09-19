import type { Discipline } from "@/lib/domain/types";

/**
 * The seven units of the 1st period, 2026.2, transcribed from the official
 * UNIEURO teaching plans in public/planos. Fields absent from a plan are
 * left undefined and surfaced as "não informado" — never guessed.
 */
export const disciplines: readonly Discipline[] = [
  {
    id: "mac-1",
    slug: "morfofuncional-aplicado-a-clinica-i",
    name: "Morfofuncional Aplicado à Clínica I",
    shortName: "MAC I",
    code: "MED01I1",
    period: 1,
    visibility: "visivel",
    origin: "seed",
    semester: "2026.2",
    workload: "120h",
    weeklyWorkload: "6h",
    color: "#0f5563",
    colorSoft: "#e0eef1",
    motif: "anatomia",
    teachingPlanFile: "/planos/mac-1.pdf",
    description:
      "Introdução ao estudo integrado dos fundamentos morfofuncionais essenciais para a prática clínica, abrangendo embriologia, desde a concepção até a formação embrionária; histologia, com foco na organização celular e nos diferentes tecidos corporais; parasitologia, enfatizando a identificação e compreensão de parasitas relevantes à saúde humana; e anatomia clínica, abordando princípios básicos, terminologia e importância na prática médica, com ênfase no sistema musculoesquelético.",
    syllabus: [
      {
        title: "Embriologia",
        items: [
          "Oogênese e espermatogênese",
          "Primeira, segunda, terceira e quarta semanas do desenvolvimento embrionário",
        ],
      },
      {
        title: "Histologia",
        items: [
          "Tecido epitelial de revestimento e glandular",
          "Tecido conjuntivo propriamente dito e especial",
          "Tecido ósseo e cartilaginoso",
          "Tecidos musculares",
          "Tecido nervoso — cérebro, cerebelo, medula espinhal, nervo e gânglio",
        ],
      },
      {
        title: "Parasitologia",
        items: [
          "Protozoários intestinais — giardíase e amebíase",
          "Protozoários hemáticos — malária e doença de Chagas",
          "Protozoários teciduais — leishmaniose e toxoplasmose",
          "Protozoário urogenital — tricomoníase",
          "Platelmintos — teníase, cisticercose e esquistossomose",
          "Nematelmintos teciduais, de transmissão fecal-oral e percutânea",
        ],
      },
      {
        title: "Anatomia clínica — sistema musculoesquelético",
        items: [
          "Referenciais anatômicos — planos, eixos e terminologia",
          "Osteologia e fisiologia da remodelação óssea",
          "Miologia da face, pescoço e tronco",
          "Esqueleto axial — coluna vertebral",
          "Esqueleto apendicular — membro superior e inferior",
          "Artrologia — tipos de articulação, cápsula e líquido sinovial",
        ],
      },
    ],
    teachers: [],
    notes: ["Docentes não identificados no plano de ensino."],
  },
  {
    id: "ha-1",
    slug: "habilidades-e-atitudes-i",
    name: "Habilidades e Atitudes I",
    shortName: "HA I",
    period: 1,
    visibility: "visivel",
    origin: "seed",
    semester: "2026.2",
    workload: "80h",
    color: "#1f5f8b",
    colorSoft: "#e2eef5",
    motif: "semiologia",
    teachingPlanFile: "/planos/ha-1.pdf",
    description:
      "Introdução à semiologia médica e à semiotécnica, com foco na aquisição progressiva de habilidades para a realização da anamnese, domínio da linguagem técnico-científica da Medicina e desenvolvimento de atitudes fundamentais para a relação médico-paciente. Ênfase nas etapas iniciais do exame físico, incluindo ectoscopia, exame físico da cabeça e pescoço, e aferição dos sinais vitais.",
    syllabus: [
      {
        title: "Unidade I — Relação médico-paciente e anamnese",
        items: [
          "Comunicação clínica, empatia e humanidades na prática médica",
          "História da Doença Atual (HDA) e caracterização sintomática",
          "Interrogatório sintomático e revisão de sistemas",
          "Antecedentes fisiológicos, patológicos, familiares e hábitos de vida",
        ],
      },
      {
        title: "Unidade II — Semiotécnica geral, ectoscopia e sinais vitais",
        items: [
          "Inspeção, palpação, percussão e ausculta",
          "Aferição e interpretação de PA, FR, FC/pulso e temperatura",
          "Ectoscopia — nível de consciência, estado geral, biotipo, postura e fácies",
          "Lesões elementares da pele",
        ],
      },
      {
        title: "Unidade III — Exame físico segmentar inicial",
        items: ["Exame físico dirigido de cabeça, face e pescoço"],
      },
      {
        title: "Unidade IV — Segurança do paciente",
        items: ["Higienização das mãos, identificação do paciente e biossegurança"],
      },
      {
        title: "Unidade V — Saúde digital e inteligência artificial",
        items: [
          "Prontuário eletrônico, telessaúde e sistemas de informação em saúde",
          "IA aplicada à semiologia e ao apoio à decisão",
          "Segurança da informação e proteção de dados do paciente",
        ],
      },
    ],
    teachers: [],
    notes: [
      "Avaliação por OSCE — N1 em 07/10 e N2 em 17/11 e 24/11. ARA em 01/12/2026.",
      "Cronograma detalhado será disponibilizado no AVA.",
    ],
  },
  {
    id: "iescg-1",
    slug: "interacao-ensino-servico-comunidade-gestao-i",
    name: "Interação Ensino-Serviço-Comunidade-Gestão I",
    shortName: "IESCG I",
    code: "MED 01I2",
    period: 1,
    visibility: "visivel",
    origin: "seed",
    semester: "2026.2",
    workload: "80h",
    weeklyWorkload: "4h",
    color: "#4a7a54",
    colorSoft: "#e6efe8",
    motif: "saude-coletiva",
    teachingPlanFile: "/planos/iescg-1.pdf",
    description:
      "SUS e promoção da saúde na atenção primária à saúde. História das políticas públicas de saúde no Brasil, Reforma Sanitária Brasileira, princípios e diretrizes do SUS, equidade e políticas públicas, história da APS no Brasil, Estratégia Saúde da Família, visita domiciliar e o trabalho dos Agentes Comunitários de Saúde.",
    syllabus: [
      {
        title: "Políticas públicas e o SUS",
        items: [
          "História das Políticas Públicas de Saúde no Brasil",
          "Reforma Sanitária Brasileira",
          "Princípios e Diretrizes do SUS",
        ],
      },
      {
        title: "Equidade e populações",
        items: [
          "Atenção à saúde da população do campo, florestas e águas",
          "Saúde indígena, da população negra e da população com deficiência",
          "Saúde do trabalhador",
          "Pessoas em vulnerabilidade social e meio ambiente",
        ],
      },
      {
        title: "Atenção primária à saúde",
        items: [
          "História da APS no Brasil e Política Nacional de Atenção Básica",
          "Estratégia Saúde da Família",
          "Visita domiciliar e o trabalho dos Agentes Comunitários de Saúde (ACS)",
          "Desigualdades em saúde e promoção da saúde",
        ],
      },
    ],
    teachers: ["Profª. Andréa Paula", "Profª. Pedrita"],
    notes: [
      "N2 inclui o Projeto de Intervenção Coletiva (PIC) e Portfólio Reflexivo.",
      "Atividades de campo em Unidades Básicas de Saúde com preceptor de cenário.",
    ],
  },
  {
    id: "hm-1",
    slug: "humanidades-medicas-i",
    name: "Humanidades Médicas I",
    shortName: "HM I",
    period: 1,
    visibility: "visivel",
    origin: "seed",
    semester: "2026.2",
    workload: "40h",
    color: "#5b4b8a",
    colorSoft: "#eae6f4",
    motif: "humanidades",
    teachingPlanFile: "/planos/hm-1.pdf",
    description:
      "Estudo da identidade e da prática médica, articulando história da Medicina, fundamentos éticos e competências essenciais ao profissionalismo. Discussão sobre humanização, direitos humanos, segurança do paciente e políticas do SUS, com atenção à diversidade e às populações vulneráveis. Reflexão sobre ética, moral, dilemas contemporâneos, saúde, doença, morte e espiritualidade.",
    syllabus: [
      {
        title: "Identidade e prática médica",
        items: [
          "SER Médico — identidade profissional",
          "História, arte e medicina",
          "Profissionalismo e competências essenciais",
        ],
      },
      {
        title: "Ética e dilemas contemporâneos",
        items: [
          "Ética, moral e dilemas contemporâneos",
          "Saúde, doença, morte e espiritualidade",
          "Código de Ética Médica",
        ],
      },
      {
        title: "Humanização e cuidado centrado na pessoa",
        items: [
          "Humanização, políticas do SUS e atendimento médico",
          "Segurança do paciente e grupos vulneráveis",
          "Medicina Baseada em Narrativas e em Evidências",
          "Atuação multiprofissional e interdisciplinar",
        ],
      },
    ],
    teachers: [
      "Profa. Dra. Vanessa Tentes (coordenadora)",
      "Prof. Dr. Miguel Procópio",
      "Profa. Ms. Clarisse Costa Republicano",
    ],
  },
  {
    id: "ic-1",
    slug: "iniciacao-cientifica-i",
    name: "Iniciação Científica I",
    shortName: "IC I",
    code: "116101",
    period: 1,
    visibility: "visivel",
    origin: "seed",
    semester: "2026.2",
    workload: "40h",
    weeklyWorkload: "2h",
    color: "#8a5a1e",
    colorSoft: "#f6ecdf",
    motif: "metodologia",
    teachingPlanFile: "/planos/ic-1.pdf",
    description:
      "Introdução ao estudo da Metodologia Científica. A ciência e o conhecimento científico. A importância da pesquisa científica em saúde. Aspectos éticos da pesquisa. A pesquisa em seres humanos: o sistema CEP/CONEP. O uso de animais para estudo e pesquisa. Tipos de trabalhos científicos. Busca de dados na internet. Desenvolvimento de um projeto de revisão bibliográfica.",
    syllabus: [
      {
        title: "Ciência e evidência",
        items: [
          "Conceito de medicina baseada em evidências",
          "Princípios da metodologia científica",
          "Tipos de pesquisa científica e pirâmide de evidências",
          "Viés de pesquisa e ferramentas de avaliação de artigos",
        ],
      },
      {
        title: "Ética em pesquisa",
        items: [
          "Princípios éticos da pesquisa com humanos e com animais",
          "O sistema CONEP, CEPs e CEUAs",
          "Ética da divulgação científica",
        ],
      },
      {
        title: "Prática e comunicação científica",
        items: [
          "Busca de dados na internet e uso da IA",
          "Plataformas de vínculo científico — ORCID, Lattes, Plataforma Brasil",
          "Redação do trabalho científico e normas ABNT",
          "Resumos para congressos, banners e apresentação oral",
        ],
      },
    ],
    teachers: ["Prof. Me. Bruna da Silva Sousa"],
    notes: [
      "A bibliografia complementar do plano registra apenas “Textos e material online disponibilizados pelo docente” — sem referências nomeadas.",
      "Integração com IESCG I na escolha do tema do projeto de revisão bibliográfica.",
    ],
  },
  {
    id: "aes-1",
    slug: "aes-1-introducao-ao-estudo-da-medicina",
    name: "AES 1 — Introdução ao Estudo da Medicina",
    shortName: "AES 1",
    period: 1,
    visibility: "visivel",
    origin: "seed",
    semester: "2026.2",
    color: "#9c4a35",
    colorSoft: "#f6e6e1",
    motif: "humanidades",
    teachingPlanFile: "/planos/aes-1.pdf",
    description:
      "Unidade de AprendizagemEstruturada por Situações-problema dedicada à introdução ao estudo da Medicina, conduzida por encontros tutoriais. Aborda história da Medicina, saúde pública em suas bases conceituais e fundamentos de anatomia e fisiologia humanas.",
    syllabus: [
      {
        title: "Eixos do módulo",
        items: [
          "História da Medicina",
          "Saúde pública — bases conceituais",
          "Princípios de anatomia e fisiologia",
          "Código de Ética Médica e a formação do médico",
        ],
      },
    ],
    teachers: [],
    notes: [
      "Metodologia por tutoria: encontros às segundas e quintas, sem gravação.",
      "Carga horária não especificada no plano de ensino.",
      "Docentes não identificados no plano de ensino.",
    ],
  },
  {
    id: "aes-2",
    slug: "aes-2-crescimento-e-diferenciacao-celular",
    name: "AES 2 — Crescimento e Diferenciação Celular",
    shortName: "AES 2",
    period: 1,
    visibility: "visivel",
    origin: "seed",
    semester: "2026.2",
    color: "#7b3f62",
    colorSoft: "#f2e5ed",
    motif: "histologia",
    teachingPlanFile: "/planos/aes-2.pdf",
    description:
      "Unidade de Aprendizagem Estruturada por Situações-problema dedicada ao crescimento e à diferenciação celular. Aborda biologia celular e molecular, organização e função da célula, ciclo celular, genética e os fundamentos histológicos dos tecidos.",
    syllabus: [
      {
        title: "Eixos do módulo",
        items: [
          "Biologia molecular da célula",
          "Biologia celular — estrutura e função",
          "Crescimento, diferenciação e ciclo celular",
          "Fundamentos de genética",
          "Histologia dos tecidos",
        ],
      },
    ],
    teachers: [],
    notes: [
      "Carga horária não especificada no plano de ensino.",
      "Docentes não identificados no plano de ensino.",
    ],
  },
];
