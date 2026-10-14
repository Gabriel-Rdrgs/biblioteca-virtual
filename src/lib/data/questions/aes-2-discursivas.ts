import type { BankQuestion } from "@/lib/domain/exam-types";

/**
 * As 15 discursivas do simulado N1 de AES 2.
 *
 * Na prova real o limite é de cinco linhas por questão; o padrão de resposta
 * vem quebrado em uma ideia por linha justamente para treinar o que é
 * essencial dizer primeiro.
 */
export const aesDiscursivas: BankQuestion[] = [
  {
    kind: "discursiva",
    id: "aes-d1",
    areaId: "biologia-celular",
    axisId: "genoma",
    topic: "Genoma",
    points: 1,
    stem: "Uma adolescente de 15 anos é encaminhada ao ambulatório de genética médica por anemia hemolítica crônica e crises de dor óssea. O sequenciamento identificou a troca de uma única base na região codificadora do gene HBB, localizado no cromossomo 11. Durante a consulta, a mãe pergunta se “o genoma inteiro da filha está alterado”. Ela conta ainda que a irmã mais nova também apresenta uma variante de base única no mesmo gene, em outra posição, mas é completamente assintomática e tem hemoglobina de estrutura normal.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Diferencie gene, cromossomo e genoma, situando o achado da paciente em cada um desses níveis de organização.",
        expected: [
          "Gene: segmento de DNA com a informação para um produto funcional (RNA ou proteína); aqui, o HBB, que codifica a cadeia β da hemoglobina.",
          "Cromossomo: molécula longa de DNA associada a proteínas (cromatina), que reúne muitos genes; o HBB fica no cromossomo 11.",
          "Genoma: conjunto completo do DNA do indivíduo (nuclear e mitocondrial).",
          "A alteração atinge uma base de um gene, e não “o genoma inteiro”.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique por que uma mutação pontual em região codificadora pode modificar o fenótipo em uma irmã e não na outra.",
        expected: [
          "A informação flui DNA → RNAm → proteína; a troca de base altera um códon.",
          "Se o novo códon especifica outro aminoácido (sentido trocado) ou uma parada (sem sentido), a proteína muda e pode haver fenótipo, como na paciente.",
          "Como o código é degenerado, a troca pode gerar um códon sinônimo (mutação silenciosa) ou um aminoácido de propriedades semelhantes, sem prejuízo funcional, como na irmã.",
          "O efeito também depende da posição na proteína e da zigosidade.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d2",
    areaId: "biologia-celular",
    axisId: "replicacao",
    topic: "Replicação",
    points: 1,
    stem: "Em um laboratório de pesquisa, células da medula óssea de um doador saudável foram cultivadas em meio contendo nucleotídeos marcados, incorporados apenas às fitas de DNA recém-sintetizadas. Após um único ciclo de divisão, todas as moléculas de DNA analisadas apresentavam uma fita marcada e uma fita não marcada. Em uma segunda etapa, os pesquisadores observaram que, na forquilha de replicação, uma das fitas novas era produzida de forma contínua, enquanto a outra surgia em pequenos segmentos que só depois eram unidos.",
    items: [
      {
        label: "a",
        points: 0.4,
        prompt: "Explique o resultado da primeira etapa com base no modelo de replicação do DNA.",
        expected: [
          "A replicação é semiconservativa: cada fita parental serve de molde para uma fita nova.",
          "Cada molécula-filha conserva uma fita parental (não marcada) pareada a uma fita recém-sintetizada (marcada).",
        ],
      },
      {
        label: "b",
        points: 0.6,
        prompt:
          "Descreva a função de helicase, primase, DNA polimerase e DNA ligase e justifique por que uma das fitas é sintetizada em pequenos segmentos (fragmentos de Okazaki).",
        expected: [
          "Helicase: rompe as pontes de hidrogênio e separa as fitas, abrindo a forquilha.",
          "Primase: sintetiza o iniciador (primer) de RNA, que oferece a extremidade 3′-OH.",
          "DNA polimerase: adiciona nucleotídeos complementares à extremidade 3′, sintetizando sempre no sentido 5′→3′, com revisão de erros.",
          "Ligase: une os fragmentos depois da remoção dos primers.",
          "As fitas são antiparalelas e a polimerase só sintetiza 5′→3′: a fita líder acompanha a abertura da forquilha e é contínua; a fita tardia é feita no sentido oposto, de modo descontínuo, com um primer para cada fragmento de Okazaki.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d3",
    areaId: "biologia-celular",
    axisId: "transcricao-traducao",
    topic: "Transcrição e tradução",
    points: 1,
    stem: "Em uma enfermaria de clínica médica, três pacientes recebem fármacos que interferem no fluxo da informação genética. O primeiro, com leucemia mieloide aguda, usa citarabina, um análogo de nucleosídeo que é incorporado à cadeia em formação e interrompe a síntese de DNA das células em divisão. O segundo, com tuberculose pulmonar, usa rifampicina, que se liga à RNA polimerase bacteriana. O terceiro, com pielonefrite, usa gentamicina, que se liga à subunidade menor do ribossomo bacteriano e provoca erros de leitura do RNAm.",
    items: [
      {
        label: "a",
        points: 0.3,
        prompt:
          "Identifique o processo molecular diretamente afetado por cada um dos três fármacos.",
        expected: [
          "Citarabina: replicação.",
          "Rifampicina: transcrição.",
          "Gentamicina: tradução.",
        ],
      },
      {
        label: "b",
        points: 0.7,
        prompt:
          "Compare esses três processos quanto a molde, produto, local predominante na célula eucariótica e finalidade biológica.",
        expected: [
          "Replicação: molde = as duas fitas do DNA; produto = DNA; local = núcleo, na fase S; finalidade = duplicar o genoma para transmiti-lo às células-filhas.",
          "Transcrição: molde = uma fita do DNA de um gene; produto = RNA (pré-RNAm, RNAr, RNAt); local = núcleo; finalidade = copiar a informação dos genes que serão expressos.",
          "Tradução: molde = RNAm lido em códons; produto = cadeia polipeptídica; local = citoplasma, nos ribossomos livres ou do retículo rugoso; finalidade = sintetizar proteínas.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d4",
    areaId: "biologia-celular",
    axisId: "regulacao-epigenetica",
    topic: "Regulação e epigenética",
    points: 1,
    stem: "Um menino de 4 anos, de família de origem mediterrânea, é investigado por anemia microcítica e hipocrômica que não responde à reposição de ferro. O sequenciamento do gene HBB mostrou região codificadora íntegra, mas identificou uma variante na região promotora, sobre o TATA box. A análise das cadeias de β-globina revelou estrutura normal, porém em quantidade bem inferior à esperada.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Explique o mecanismo pelo qual uma variante no promotor reduz a quantidade da proteína sem alterar sua sequência de aminoácidos.",
        expected: [
          "O promotor é o local em que os fatores gerais de transcrição e a RNA polimerase II se montam para iniciar a transcrição.",
          "A variante reduz a afinidade dessa maquinaria: há menos iniciação, menos RNAm e, portanto, menos cadeia β.",
          "Como a região codificadora está intacta, os códons não mudam: o defeito é quantitativo, e não qualitativo.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt: "Diferencie promotor, enhancer e fator de transcrição.",
        expected: [
          "Promotor: sequência de DNA logo a montante do início da transcrição, onde a maquinaria basal se acopla.",
          "Enhancer: sequência reguladora de DNA que pode estar distante do gene (a montante, a jusante ou em íntrons) e aumenta a transcrição ao ligar ativadores e se aproximar do promotor pelo dobramento da cromatina.",
          "Fator de transcrição: proteína (não é DNA) que reconhece essas sequências e recruta ou dificulta a maquinaria de transcrição.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d5",
    areaId: "biologia-celular",
    axisId: "regulacao-epigenetica",
    topic: "Regulação e epigenética",
    points: 1,
    stem: "O gene CALCA está presente em todas as células nucleadas de um indivíduo. Nas células C da tireoide, seu transcrito primário origina o RNAm da calcitonina, hormônio envolvido no metabolismo do cálcio; em neurônios, o mesmo transcrito origina o RNAm do peptídeo relacionado ao gene da calcitonina (CGRP), um potente vasodilatador implicado na enxaqueca. Em outro experimento, dois tecidos com quantidades semelhantes de um mesmo RNAm produziam quantidades muito diferentes da proteína correspondente; o tecido com menor produção expressava intensamente um microRNA complementar à região 3′ não traduzida desse RNAm.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Explique como um único gene pode originar duas proteínas diferentes em tecidos distintos.",
        expected: [
          "Por splicing alternativo: o pré-RNAm contém éxons e íntrons; o spliceossomo remove os íntrons e, conforme os fatores de splicing presentes em cada tecido, inclui ou exclui determinados éxons.",
          "Formam-se RNAm maduros diferentes a partir do mesmo gene e, portanto, proteínas diferentes (calcitonina ou CGRP).",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique como o microRNA reduz a produção proteica e indique em que nível da regulação da expressão gênica esses dois mecanismos atuam.",
        expected: [
          "O microRNA, incorporado ao complexo RISC, pareia com a região 3′ não traduzida do RNAm-alvo.",
          "Esse pareamento bloqueia a tradução e/ou promove a degradação do RNAm: há RNAm, mas pouca proteína.",
          "Os dois mecanismos são pós-transcricionais: atuam sobre o RNA, sem alterar a sequência do DNA.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d6",
    areaId: "biologia-celular",
    axisId: "regulacao-epigenetica",
    topic: "Regulação e epigenética",
    points: 1,
    stem: "Um paciente de 62 anos é submetido à ressecção de um adenocarcinoma de cólon. A imuno-histoquímica do tumor mostrou ausência da proteína de reparo MLH1, embora o sequenciamento do gene MLH1 não tenha encontrado mutações. A análise complementar revelou hipermetilação das ilhas CpG do promotor desse gene nas células tumorais. Ao discutir o caso, o oncologista comenta que fármacos inibidores de histona-desacetilases (HDAC) vêm sendo estudados para reativar genes silenciados.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Explique, passo a passo, como a metilação do DNA no promotor e a acetilação das histonas modificam a acessibilidade da cromatina e a expressão gênica.",
        expected: [
          "DNA-metiltransferases adicionam grupos metil a citosinas de dinucleotídeos CpG.",
          "No promotor, isso dificulta a ligação de fatores de transcrição e atrai proteínas que reconhecem o DNA metilado (como a MeCP2), as quais recrutam HDACs.",
          "Histonas desacetiladas interagem mais fortemente com o DNA: a cromatina se compacta (heterocromatina) e o gene é silenciado, sem mutação.",
          "A acetilação das histonas neutraliza as cargas positivas das lisinas, afrouxa a interação com o DNA e abre a cromatina (eucromatina), favorecendo a transcrição; inibir HDAC preserva esse estado.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Um estudante resume o caso dizendo que “metilação sempre desliga genes”. Aponte uma limitação dessa frase.",
        expected: [
          "O efeito depende do contexto: da região metilada, do tipo celular e das demais marcas presentes.",
          "A metilação no corpo de genes costuma associar-se a genes ativos.",
          "A metilação de um elemento silenciador ou isolador pode aumentar a expressão do gene vizinho (como no imprinting).",
          "A metilação de histonas pode ativar ou reprimir conforme o resíduo. Além disso, a marca é reversível.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d7",
    areaId: "biologia-celular",
    axisId: "regulacao-epigenetica",
    topic: "Regulação e epigenética",
    points: 1,
    stem: "L.M., 6 anos, sexo feminino, é acompanhada por transtorno do espectro autista (TEA). Como parte de um protocolo de pesquisa, um estudo epigenético em sangue periférico apontou hipermetilação do promotor do gene MECP2. Os pais chegam à consulta afirmando ter lido que esse resultado “comprova a causa do autismo” da filha e perguntam se MECP2 e MeCP2 “são a mesma coisa”.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Diferencie: o gene MECP2; a proteína MeCP2; a hipermetilação do promotor de MECP2; e a ligação de MeCP2 ao DNA metilado.",
        expected: [
          "Gene MECP2: sequência de DNA, no cromossomo X, que contém a informação para a proteína.",
          "Proteína MeCP2: produto do gene; “leitora” de metilação, que se liga a CpG metilados e recruta correpressores (como HDACs), regulando outros genes, sobretudo em neurônios.",
          "Hipermetilação do promotor de MECP2: marca epigenética sobre o próprio gene, que tende a reduzir sua transcrição; aqui o gene é o alvo da regulação.",
          "Ligação de MeCP2 ao DNA metilado: função da proteína sobre outros genes; aqui a proteína é o agente da regulação. São dois sentidos regulatórios distintos.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt: "Explique por que um resultado epigenético isolado não prova causalidade do TEA.",
        expected: [
          "Associação não é causa: a marca pode ser consequência, coincidência ou efeito de idade, ambiente ou medicamentos.",
          "Marcas epigenéticas são tecido-específicas: o sangue não reflete necessariamente os neurônios, e não se demonstrou queda da proteína no tecido relevante.",
          "O TEA é multifatorial; seriam necessários estudos controlados e replicados, com plausibilidade e relação temporal.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d8",
    areaId: "biologia-celular",
    axisId: "celulas-tronco",
    topic: "Células-tronco e adaptações",
    points: 1,
    stem: "Um paciente de 19 anos com anemia aplásica grave recebe transplante de células-tronco hematopoiéticas de um doador compatível. Poucas semanas depois, o hemograma mostra recuperação de hemácias, leucócitos e plaquetas, e essa produção se mantém estável ao longo de anos de acompanhamento, mesmo tendo sido infundido um número relativamente pequeno de células, que se alojaram na medula óssea do receptor.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Defina autorrenovação, diferenciação, potência e nicho de célula-tronco, relacionando cada conceito ao caso.",
        expected: [
          "Autorrenovação: capacidade de gerar novas células-tronco e manter o reservatório; explica a produção sustentada por anos.",
          "Diferenciação: aquisição de características especializadas por expressão seletiva de genes; origina hemácias, leucócitos e plaquetas.",
          "Potência: amplitude de tipos celulares que a célula pode originar; a célula-tronco hematopoiética é multipotente.",
          "Nicho: microambiente (células estromais, matriz, fatores solúveis) que regula quiescência, autorrenovação e diferenciação; no caso, a medula óssea.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Diferencie divisão simétrica e divisão assimétrica e explique por que o equilíbrio entre elas é importante.",
        expected: [
          "Simétrica: duas células-filhas iguais (duas células-tronco, expandindo o reservatório, ou duas progenitoras, consumindo-o).",
          "Assimétrica: uma célula-tronco e uma progenitora destinada à diferenciação.",
          "Diferenciação em excesso esgota o reservatório (falência do tecido); autorrenovação em excesso, sem diferenciação, leva ao acúmulo de células imaturas e favorece neoplasias.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d9",
    areaId: "biologia-celular",
    axisId: "celulas-tronco",
    topic: "Células-tronco e adaptações",
    points: 1,
    stem: "Um homem de 58 anos sofreu infarto agudo do miocárdio de parede anterior e evoluiu com fração de ejeção de 35%. A família traz à consulta o anúncio de uma clínica que oferece “aplicação de células-tronco mesenquimais que se transformam em novos cardiomiócitos e regeneram o coração”. O material cita, como prova, experimentos em que essas células, cultivadas em laboratório com indutores específicos, passaram a expressar proteínas musculares.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Diferencie potencial de diferenciação in vitro, diferenciação in vivo e efeito parácrino.",
        expected: [
          "Potencial in vitro: o que a célula faz em cultura, sob indutores artificiais; não garante o mesmo comportamento no organismo.",
          "Diferenciação in vivo: exige que a célula sobreviva, se enxerte, se diferencie e se integre elétrica e mecanicamente ao tecido.",
          "Efeito parácrino: secreção de citocinas, fatores de crescimento e vesículas que modulam inflamação, angiogênese, fibrose e sobrevivência das células residentes, sem substituí-las.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Analise criticamente a afirmação do anúncio e indique o que seria necessário para afirmar benefício clínico.",
        expected: [
          "As células mesenquimais são multipotentes, com diferenciação clássica em osso, cartilagem e gordura.",
          "Expressar proteínas musculares em cultura não equivale a formar cardiomiócitos funcionais e integrados.",
          "Poucas células persistem no miocárdio; as melhoras descritas são atribuídas sobretudo a efeitos parácrinos e imunomoduladores.",
          "Benefício clínico exige ensaios clínicos controlados, com desfechos relevantes (função, sintomas, mortalidade) e avaliação de segurança.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d10",
    areaId: "biologia-celular",
    axisId: "celulas-tronco",
    topic: "Adaptações celulares",
    points: 1,
    stem: "Em uma sessão de anatomia patológica, quatro situações são apresentadas aos estudantes: (I) homem hipertenso de longa data, com espessamento concêntrico da parede do ventrículo esquerdo; (II) mulher em uso de estrogênio sem oposição de progesterona, com espessamento do endométrio por aumento do número de glândulas; (III) jovem que permaneceu oito semanas com a perna imobilizada por gesso e apresenta redução evidente da massa da panturrilha; (IV) tabagista crônico cuja biópsia brônquica mostra epitélio escamoso estratificado no lugar do epitélio respiratório ciliado.",
    items: [
      {
        label: "a",
        points: 0.4,
        prompt: "Classifique a adaptação celular predominante em cada uma das quatro situações.",
        expected: ["I: hipertrofia.", "II: hiperplasia.", "III: atrofia.", "IV: metaplasia."],
      },
      {
        label: "b",
        points: 0.6,
        prompt: "Para cada adaptação identificada, apresente a definição e o mecanismo geral.",
        expected: [
          "Hipertrofia: aumento do tamanho das células por maior síntese de proteínas e organelas, em resposta à sobrecarga; típica de células com pouca capacidade de divisão.",
          "Hiperplasia: aumento do número de células por proliferação estimulada por hormônios ou fatores de crescimento, em tecidos capazes de se dividir.",
          "Atrofia: redução do tamanho (e do número) das células por menor síntese e maior degradação de proteínas (ubiquitina–proteassoma, autofagia), por desuso, desnervação, isquemia ou desnutrição.",
          "Metaplasia: substituição, em princípio reversível, de um tipo celular diferenciado por outro mais resistente à agressão, por reprogramação de células-tronco ou progenitoras; há perda de função (muco, cílios) e risco de displasia.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d11",
    areaId: "biologia-celular",
    axisId: "ciclo-neoplasia",
    topic: "Ciclo celular e neoplasia",
    points: 1,
    stem: "Fibroblastos de um doador saudável e de um paciente com síndrome de Li-Fraumeni (mutação germinativa com perda de função do gene TP53) foram expostos à mesma dose de radiação ionizante. Os fibroblastos do doador interromperam o ciclo em G1 e só voltaram a proliferar depois do reparo do DNA. Os fibroblastos do paciente continuaram a entrar em fase S, mesmo com quebras não reparadas. O paciente tem história pessoal e familiar de múltiplos tumores em idade jovem.",
    items: [
      {
        label: "a",
        points: 0.4,
        prompt: "Descreva o que ocorre em G0, G1, S, G2 e M.",
        expected: [
          "G0: quiescência, fora do ciclo.",
          "G1: crescimento, síntese de RNA e proteínas e decisão de se dividir.",
          "S: replicação do DNA.",
          "G2: crescimento, conferência do DNA replicado e preparo para a divisão.",
          "M: mitose e citocinese.",
        ],
      },
      {
        label: "b",
        points: 0.6,
        prompt:
          "Explique como Rb/E2F e p53/p21 controlam o ciclo celular diante de dano ao DNA e por que as células do paciente não interrompem o ciclo.",
        expected: [
          "A Rb hipofosforilada mantém o fator E2F sequestrado. Complexos ciclina–CDK (ciclina D–CDK4/6, ciclina E–CDK2) fosforilam a Rb, liberando E2F, que ativa os genes da fase S.",
          "Diante de dano, a p53 é estabilizada e induz a p21, que inibe os complexos ciclina–CDK: a Rb permanece hipofosforilada e a célula para em G1/S para o reparo; se o dano for irreparável, ocorre apoptose ou senescência.",
          "Sem p53 funcional não há indução de p21: a Rb é fosforilada, E2F fica livre e a célula replica DNA lesado, acumulando mutações, o que explica a predisposição a tumores.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d12",
    areaId: "biologia-celular",
    axisId: "ciclo-neoplasia",
    topic: "Ciclo celular e neoplasia",
    points: 1,
    stem: "Uma mulher de 52 anos percebe um nódulo endurecido na mama esquerda. A biópsia por agulha grossa tem como laudo “carcinoma ductal invasivo”. Na consulta de retorno, muito ansiosa, ela pergunta: “Doutor, invasivo quer dizer que o câncer já se espalhou pelo meu corpo?”.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Explique o significado do diagnóstico utilizando os termos epitélio ductal, membrana basal, estroma e invasão local, e diferencie-o do carcinoma ductal in situ.",
        expected: [
          "Carcinoma é neoplasia maligna de origem epitelial; ductal indica origem no epitélio dos ductos mamários.",
          "No carcinoma in situ, as células malignas permanecem confinadas ao ducto, com a membrana basal íntegra.",
          "No invasivo, elas romperam a membrana basal e infiltraram o estroma (tecido conjuntivo que contém vasos sanguíneos e linfáticos): é a invasão local.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Explique por que esse diagnóstico não é sinônimo de metástase e qual é o papel do estadiamento.",
        expected: [
          "A invasão do estroma dá acesso a vasos e torna a metástase possível, mas metástase é o implante de células tumorais em local distante (linfonodos, ossos, fígado, pulmões) e precisa ser demonstrada.",
          "O estadiamento (sistema TNM: tamanho do tumor, linfonodos, metástases), por exame clínico, imagem e avaliação linfonodal, define a extensão real da doença, o prognóstico e o tratamento.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d13",
    areaId: "biologia-celular",
    axisId: "senescencia-apoptose",
    topic: "Senescência e apoptose",
    points: 1,
    stem: "Fibroblastos da pele de um doador de 80 anos foram mantidos em cultura. Após poucas passagens, as células pararam de se dividir, mas permaneceram viáveis por semanas: tornaram-se grandes e achatadas, positivas para β-galactosidase associada à senescência, e passaram a secretar IL-6, IL-8 e metaloproteinases. Uma segunda placa das mesmas células, exposta a alta dose de radiação ultravioleta, mostrou em poucas horas células retraídas, com cromatina condensada, fragmentação nuclear e formação de corpos apoptóticos.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Diferencie senescência e apoptose com base nos achados das duas placas e explique o que é o SASP.",
        expected: [
          "Placa 1 — senescência: parada proliferativa estável (eixos p53/p21 e p16/Rb) em célula viva e metabolicamente ativa.",
          "Placa 2 — apoptose: morte celular programada, executada por caspases, com eliminação da célula.",
          "SASP (fenótipo secretor associado à senescência): conjunto de citocinas, quimiocinas e proteases (IL-6, IL-8, metaloproteinases) secretado pela célula senescente, que modifica o microambiente e sustenta inflamação crônica.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Relacione encurtamento de telômeros, danos ao DNA e disfunção mitocondrial com o envelhecimento celular.",
        expected: [
          "O envelhecimento celular é um declínio funcional progressivo e multifatorial.",
          "Os telômeros encurtam a cada divisão (células somáticas têm pouca telomerase); quando criticamente curtos, são lidos como dano e ativam p53, levando à senescência ou à apoptose.",
          "Danos ao DNA acumulam-se por espécies reativas de oxigênio, radiação e falhas de reparo, acionando a mesma resposta.",
          "A mitocôndria disfuncional produz menos ATP e mais espécies reativas, que ampliam o dano (ciclo vicioso), e pode liberar citocromo c.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d14",
    areaId: "biologia-celular",
    axisId: "senescencia-apoptose",
    topic: "Senescência e apoptose",
    points: 1,
    stem: "Um paciente de 67 anos com leucemia linfocítica crônica apresenta linfócitos B que se acumulam no sangue e nos linfonodos, não por proliferarem rapidamente, mas por viverem mais do que deveriam. A análise mostra superexpressão da proteína BCL-2. Inicia-se tratamento com venetoclax, um fármaco “mimético de BH3” que se liga à BCL-2 e a inibe; em poucos dias, observa-se morte maciça das células leucêmicas.",
    items: [
      {
        label: "a",
        points: 0.7,
        prompt:
          "Descreva a via intrínseca (mitocondrial) da apoptose, do estímulo inicial até as caspases executoras, citando: proteínas BH3-only, BAX/BAK, BCL-2/BCL-XL, MOMP, citocromo c, APAF-1, apoptossomo e caspases.",
        expected: [
          "Estresse intracelular (dano ao DNA, privação de fatores de sobrevivência) ativa proteínas BH3-only (BIM, PUMA, NOXA), que neutralizam as antiapoptóticas BCL-2/BCL-XL e ativam BAX/BAK.",
          "BAX e BAK oligomerizam-se na membrana mitocondrial externa e a permeabilizam (MOMP); o citocromo c sai para o citosol.",
          "O citocromo c liga-se à APAF-1 e forma, com a pró-caspase-9, o apoptossomo; a caspase-9 (iniciadora) ativa as caspases 3, 6 e 7 (executoras), que desmontam a célula.",
        ],
      },
      {
        label: "b",
        points: 0.3,
        prompt:
          "Explique por que a superexpressão de BCL-2 favorece a leucemia e como o fármaco restabelece a apoptose.",
        expected: [
          "O excesso de BCL-2 sequestra as proteínas pró-apoptóticas e impede a MOMP: as células não morrem e se acumulam.",
          "O venetoclax ocupa a BCL-2 e libera essas proteínas, permitindo a ativação de BAX/BAK e a retomada da via.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "aes-d15",
    areaId: "biologia-celular",
    axisId: "senescencia-apoptose",
    topic: "Senescência e apoptose",
    points: 1,
    stem: "Na biópsia hepática de um paciente com hepatite viral, observam-se hepatócitos isolados, retraídos e intensamente eosinofílicos, com núcleo condensado e fragmentado, alguns já englobados por macrófagos, sem extravasamento de conteúdo celular. Sabe-se que linfócitos T citotóxicos que expressam FasL reconhecem os hepatócitos infectados. Em outro paciente, com intoxicação maciça por paracetamol, a biópsia mostra extensas áreas de hepatócitos tumefeitos, com membranas rompidas, cercados por intenso infiltrado inflamatório.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Descreva a via extrínseca da apoptose no primeiro paciente (FasL/Fas, FADD, DISC, caspase-8), explique como ela se conecta à via intrínseca (BID/tBID) e indique onde as duas vias convergem.",
        expected: [
          "O FasL do linfócito T liga-se ao receptor Fas do hepatócito; o receptor trimeriza e recruta a proteína adaptadora FADD e a pró-caspase-8, formando o DISC, no qual a caspase-8 é ativada.",
          "A caspase-8 ativa diretamente as caspases executoras e também cliva BID em tBID, que ativa BAX/BAK na mitocôndria, amplificando o sinal pela via intrínseca.",
          "As duas vias convergem nas caspases executoras (3, 6 e 7).",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Diferencie apoptose e necrose quanto à morfologia e à resposta inflamatória, com base nas duas biópsias.",
        expected: [
          "Apoptose (1º paciente): células isoladas, retração, condensação e fragmentação nuclear, membrana íntegra, corpos apoptóticos fagocitados; sem inflamação significativa.",
          "Necrose (2º paciente): grupos de células, tumefação, ruptura da membrana e extravasamento do conteúdo; com inflamação.",
        ],
      },
    ],
  },
];
