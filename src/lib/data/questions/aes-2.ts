import type { BankQuestion, QuestionArea } from "@/lib/domain/exam-types";
import { aesDiscursivas } from "./aes-2-discursivas";
import { aesObjetivas } from "./aes-2-objetivas";

/**
 * AES 2 — Crescimento e Diferenciação Celular, área única da unidade.
 *
 * Os eixos seguem os problemas do tutorial, do genoma à morte celular.
 * O caderno impresso traz o código genético como anexo no fim da prova;
 * aqui ele fica preso à questão que manda consultá-lo, que é onde serve.
 */
export const aesArea: QuestionArea = {
  id: "biologia-celular",
  disciplineId: "aes-2",
  label: "Crescimento e diferenciação celular",
  shortLabel: "Celular",
  sourceNote:
    "Questões autorais de treino, elaboradas no formato da avaliação N1 de AES 2. Não é avaliação institucional.",
  axes: [
    {
      id: "genoma",
      label: "Genoma e ácidos nucleicos",
      group: "fluxo da informação",
      remedy:
        "Gene, cromossomo e genoma são três escalas da mesma coisa; fixe a diferença entre elas.",
    },
    {
      id: "replicacao",
      label: "Replicação do DNA",
      group: "fluxo da informação",
      remedy:
        "Desenhe a forquilha de memória e nomeie quem faz o quê: helicase, primase, polimerase, ligase.",
    },
    {
      id: "transcricao-traducao",
      label: "Transcrição e tradução",
      group: "fluxo da informação",
      remedy: "Para cada processo: molde, produto, local na célula e finalidade. Nessa ordem.",
    },
    {
      id: "regulacao-epigenetica",
      label: "Regulação gênica e epigenética",
      group: "fluxo da informação",
      remedy:
        "Metilação, acetilação, enhancer, microRNA: separe o que muda a sequência do que só muda o acesso a ela.",
    },
    {
      id: "celulas-tronco",
      label: "Células-tronco, diferenciação e adaptações",
      group: "crescimento e diferenciação",
      remedy:
        "Hipertrofia, hiperplasia, atrofia e metaplasia com um exemplo clínico cada; depois autorrenovação e potência.",
    },
    {
      id: "ciclo-neoplasia",
      label: "Ciclo celular e neoplasia",
      group: "crescimento e diferenciação",
      remedy: "Rb/E2F e p53/p21 são o eixo inteiro; o resto da neoplasia pendura neles.",
    },
    {
      id: "senescencia-apoptose",
      label: "Senescência e apoptose",
      group: "morte e envelhecimento",
      remedy:
        "Vias intrínseca e extrínseca até as caspases executoras, e o que separa apoptose de necrose e de senescência.",
    },
  ],
  figures: [
    {
      id: "aes-f1",
      number: 1,
      path: "aes-fig-01.svg",
      width: 640,
      height: 440,
      caption: "Código genético — códons do RNAm, lidos no sentido 5′→3′",
      source: "Figura original, elaborada para este simulado",
    },
  ],
};

export const aesQuestions: BankQuestion[] = [...aesDiscursivas, ...aesObjetivas];
