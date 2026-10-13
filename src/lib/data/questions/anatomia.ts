import type { BankQuestion, QuestionArea } from "@/lib/domain/exam-types";
import { anatomiaDiscursivas } from "./anatomia-discursivas";
import { anatomiaObjetivas } from "./anatomia-objetivas";

/**
 * Anatomia clínica — a outra área que a N1 de MAC I cobra junto com
 * parasitologia. Mesma estrutura: eixos próprios, figuras próprias, e as
 * questões no banco comum.
 */
export const anatomiaArea: QuestionArea = {
  id: "anatomia",
  disciplineId: "mac-1",
  label: "Anatomia clínica",
  shortLabel: "Anatomia",
  sourceNote:
    "Questões elaboradas a partir do Moore Anatomia Orientada para a Clínica. Figuras do Netter Flash Cards de Anatomia (3ª ed.), reproduzidas do material do estudante, para estudo pessoal.",
  axes: [
    {
      id: "referenciais",
      label: "Referenciais anatômicos",
      group: "orientação",
      remedy:
        "Posição anatômica, planos e termos de relação: desenhe os três planos e nomeie tudo a partir deles.",
    },
    {
      id: "osteologia-geral",
      label: "Osteologia e remodelação óssea",
      group: "ossos",
      remedy:
        "Tipos de osso, partes do osso longo e o trio osteoclasto–osteoblasto–osteócito; ligue cada um a uma doença.",
    },
    {
      id: "cranio",
      label: "Osteologia do crânio",
      group: "ossos",
      remedy:
        "Decore os forames pelo que passa por eles, e não pelo nome: é assim que a questão cobra.",
    },
    {
      id: "contracao",
      label: "Contração muscular",
      group: "músculos",
      remedy:
        "Refaça o caminho do potencial de ação até a ponte cruzada, citando onde cada fármaco do caso age.",
    },
    {
      id: "miologia",
      label: "Miologia da face e do pescoço",
      group: "músculos",
      remedy:
        "Separe expressão facial (NC VII) de mastigação (NC V3): quase toda questão do eixo vive nessa fronteira.",
    },
    {
      id: "coluna",
      label: "Coluna vertebral",
      group: "ossos",
      remedy:
        "Curvaturas primárias e secundárias, atlas e áxis, e por que a hérnia vai para posterolateral.",
    },
    {
      id: "dorso",
      label: "Músculos do dorso",
      group: "músculos",
      remedy:
        "Extrínseco move o braço e vem de ramo anterior; próprio move a coluna e vem de ramo posterior.",
    },
    {
      id: "parede-abdominal",
      label: "Parede abdominal",
      group: "músculos",
      remedy:
        "Camadas da superfície à profundidade, bainha do reto acima e abaixo da linha arqueada, e o canal inguinal.",
    },
    {
      id: "assoalho-pelvico",
      label: "Assoalho pélvico",
      group: "músculos",
      remedy: "Diafragma da pelve: quem o forma, o que sustenta e o papel do puborretal.",
    },
  ],
  figures: [
    { id: "af1", number: 1, path: "anat-fig-01.jpg", width: 942, height: 992, caption: "Crânio, vista lateral", source: "Netter Flash Cards de Anatomia, card 1-2" },
    { id: "af2", number: 2, path: "anat-fig-02.jpg", width: 942, height: 992, caption: "Músculos do pescoço, vista anterior", source: "Netter Flash Cards de Anatomia, card 1-44" },
    { id: "af3", number: 3, path: "anat-fig-03.jpg", width: 942, height: 992, caption: "Ligamentos vertebrais, região lombar", source: "Netter Flash Cards de Anatomia, card 2-6" },
    { id: "af4", number: 4, path: "anat-fig-04.jpg", width: 942, height: 992, caption: "Parede anterior do abdome, dissecação profunda", source: "Netter Flash Cards de Anatomia, card 4-6" },
    { id: "af5", number: 5, path: "anat-fig-05.jpg", width: 942, height: 992, caption: "Crânio, vista anterior", source: "Netter Flash Cards de Anatomia, card 1-1" },
    { id: "af6", number: 6, path: "anat-fig-06.jpg", width: 942, height: 992, caption: "Forames da base do crânio, vista superior", source: "Netter Flash Cards de Anatomia, card 1-6" },
    { id: "af7", number: 7, path: "anat-fig-07.jpg", width: 942, height: 992, caption: "Mandíbula, vista anterolateral superior", source: "Netter Flash Cards de Anatomia, card 1-7" },
    { id: "af8", number: 8, path: "anat-fig-08.jpg", width: 942, height: 992, caption: "Vista lateral da cabeça", source: "Netter Flash Cards de Anatomia, card 1-28" },
    { id: "af9", number: 9, path: "anat-fig-09.jpg", width: 942, height: 992, caption: "Coluna vertebral", source: "Netter Flash Cards de Anatomia, card 2-1" },
    { id: "af10", number: 10, path: "anat-fig-10.jpg", width: 942, height: 992, caption: "Vértebras cervicais: atlas e áxis", source: "Netter Flash Cards de Anatomia, card 1-12" },
    { id: "af11", number: 11, path: "anat-fig-11.jpg", width: 942, height: 992, caption: "Vértebras torácicas", source: "Netter Flash Cards de Anatomia, card 2-3" },
    { id: "af12", number: 12, path: "anat-fig-12.jpg", width: 942, height: 992, caption: "Músculos do dorso", source: "Netter Flash Cards de Anatomia, card 2-8" },
    { id: "af13", number: 13, path: "anat-fig-13.jpg", width: 942, height: 992, caption: "Canal inguinal e funículo espermático", source: "Netter Flash Cards de Anatomia, card 4-14" },
    { id: "af14", number: 14, path: "anat-fig-14.jpg", width: 942, height: 992, caption: "Pelve, vista superior, vísceras removidas", source: "Netter Flash Cards de Anatomia, card 5-2" },
  ],
};

export const anatomiaQuestions: readonly BankQuestion[] = [
  ...anatomiaDiscursivas,
  ...anatomiaObjetivas,
];
