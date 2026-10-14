import type { BankQuestion, QuestionArea } from "@/lib/domain/exam-types";
import { icDiscursivas } from "./ic-1-discursivas";
import { icObjetivas } from "./ic-1-objetivas";

/**
 * Iniciação Científica I — área única da unidade curricular.
 *
 * Diferente de MAC I, aqui não há várias matérias dentro da mesma prova: o
 * que separa as questões são os eixos do cronograma, das semanas 1 a 9.
 *
 * As figuras são desenhos originais, refeitos em SVG a partir do caderno
 * impresso. Nenhuma reproduz imagem de livro.
 */
export const icArea: QuestionArea = {
  id: "iniciacao-cientifica",
  disciplineId: "ic-1",
  label: "Iniciação Científica",
  shortLabel: "IC",
  sourceNote:
    "Questões elaboradas a partir da bibliografia básica da unidade (Vieira e Hossne, Metodologia científica para a área de saúde; Pereira, Saúde baseada em evidências; Faintuch, Ética em pesquisa; Lakatos e Marconi) e das Resoluções CNS nº 466/2012 e nº 510/2016. Figuras originais.",
  axes: [
    {
      id: "ciencia-conhecimento",
      label: "Ciência e conhecimento científico",
      group: "fundamentos",
      remedy:
        "Separe os quatro tipos de conhecimento e as características do científico; o resto do eixo decorre disso.",
    },
    {
      id: "mbe",
      label: "Medicina baseada em evidências",
      group: "fundamentos",
      remedy:
        "Os três componentes, o PICO e as cinco etapas, nessa ordem, resolvem o eixo inteiro.",
    },
    {
      id: "tipos-pesquisa",
      label: "Tipos de pesquisa e pirâmide de evidências",
      group: "métodos",
      remedy:
        "Desenhe cada delineamento de memória: ponto de partida, direção no tempo e medida de associação.",
    },
    {
      id: "busca-ia",
      label: "Busca de dados e uso da IA",
      group: "métodos",
      remedy:
        "Monte uma estratégia real com AND, OR e aspas, e treine conferir um DOI até o artigo abrir.",
    },
    {
      id: "vieses",
      label: "Vieses e avaliação crítica",
      group: "métodos",
      remedy:
        "Viés não some com amostra maior: classifique de novo os exemplos clássicos de seleção, aferição e confusão.",
    },
    {
      id: "etica-humanos",
      label: "Ética em pesquisa com seres humanos",
      group: "ética e integridade",
      remedy:
        "Belmont, Nuremberg, Helsinque e a Resolução 466 em uma linha do tempo; depois o caminho do projeto pelo CEP.",
    },
    {
      id: "animais",
      label: "Pesquisa com animais",
      group: "ética e integridade",
      remedy: "Os 3Rs, a Lei Arouca e quem faz o quê: CONCEA normatiza, CEUA aprova.",
    },
    {
      id: "integridade",
      label: "Integridade, divulgação e plataformas",
      group: "ética e integridade",
      remedy:
        "Lattes, ORCID, Plataforma Brasil e DOI: o que cada um identifica. E os critérios de autoria.",
    },
  ],
  figures: [
    {
      id: "ic-f1",
      number: 1,
      path: "ic-fig-01.svg",
      width: 560,
      height: 420,
      caption: "Etapas de uma investigação científica",
      source: "Figura original, elaborada para este simulado",
    },
    {
      id: "ic-f2",
      number: 2,
      path: "ic-fig-02.svg",
      width: 560,
      height: 400,
      caption: "Hierarquia dos delineamentos para perguntas sobre intervenções",
      source: "Figura original, elaborada para este simulado",
    },
    {
      id: "ic-f3",
      number: 3,
      path: "ic-fig-03.svg",
      width: 560,
      height: 330,
      caption:
        "Dois delineamentos observacionais (A e B); o traço vermelho marca o início do estudo",
      source: "Figura original, elaborada para este simulado",
    },
    {
      id: "ic-f4",
      number: 4,
      path: "ic-fig-04.svg",
      width: 600,
      height: 250,
      caption: "Esquema do estudo descrito no caso",
      source: "Figura original, elaborada para este simulado",
    },
    {
      id: "ic-f5",
      number: 5,
      path: "ic-fig-05.svg",
      width: 620,
      height: 300,
      caption: "Gráfico de floresta (forest plot) da metanálise",
      source: "Figura original, elaborada para este simulado",
    },
    {
      id: "ic-f6",
      number: 6,
      path: "ic-fig-06.svg",
      width: 560,
      height: 280,
      caption: "Trâmite de um projeto de pesquisa com seres humanos",
      source: "Figura original, elaborada para este simulado",
    },
    {
      id: "ic-f7",
      number: 7,
      path: "ic-fig-07.svg",
      width: 420,
      height: 360,
      caption: "Componentes da medicina baseada em evidências",
      source: "Figura original, elaborada para este simulado",
    },
    {
      id: "ic-f8",
      number: 8,
      path: "ic-fig-08.svg",
      width: 480,
      height: 180,
      caption: "Casos de infarto agudo do miocárdio (IAM) em 10 anos de seguimento",
      source: "Figura original, elaborada para este simulado",
    },
    {
      id: "ic-f9",
      number: 9,
      path: "ic-fig-09.svg",
      width: 560,
      height: 220,
      caption:
        "Artigos recuperados (área destacada) em três estratégias de busca com os termos A e B",
      source: "Figura original, elaborada para este simulado",
    },
    {
      id: "ic-f10",
      number: 10,
      path: "ic-fig-10.svg",
      width: 480,
      height: 360,
      caption: "Gráfico de funil dos estudos incluídos em uma metanálise",
      source: "Figura original, elaborada para este simulado",
    },
    {
      id: "ic-f11",
      number: 11,
      path: "ic-fig-11.svg",
      width: 560,
      height: 260,
      caption: "Risco de viés de três ensaios clínicos, avaliado com a ferramenta RoB 2",
      source: "Figura original, elaborada para este simulado",
    },
    {
      id: "ic-f12",
      number: 12,
      path: "ic-fig-12.svg",
      width: 620,
      height: 180,
      caption: "Marcos da ética em pesquisa com seres humanos",
      source: "Figura original, elaborada para este simulado",
    },
  ],
};

export const icQuestions: BankQuestion[] = [...icDiscursivas, ...icObjetivas];
