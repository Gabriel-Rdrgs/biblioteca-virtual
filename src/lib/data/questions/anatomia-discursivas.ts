import type { BankQuestion } from "@/lib/domain/exam-types";

/**
 * As 15 discursivas de Anatomia clínica do caderno N1 de MAC I.
 *
 * `expected` é o padrão de resposta impresso, quebrado em uma ideia por
 * linha: é com ele que o estudante marca os próprios pontos.
 */
export const anatomiaDiscursivas: BankQuestion[] = [
  {
    kind: "discursiva",
    id: "anat-d1",
    areaId: "anatomia",
    axisId: "referenciais",
    topic: "Referenciais anatômicos",
    points: 1,
    stem: "Um homem de 27 anos é trazido ao pronto-socorro após queda de motocicleta. O laudo da tomografia descreve: “fratura oblíqua da diáfise do fêmur direito, com fragmento distal desviado medial e posteriormente; ferimento na face anterolateral da coxa, proximal ao joelho. Imagens adquiridas em cortes axiais, com reconstruções coronais e sagitais”. O paciente foi examinado deitado, em decúbito dorsal.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Descreva a posição anatômica e explique por que os termos do laudo valem mesmo com o paciente examinado deitado.",
        expected: [
          "Posição anatômica: corpo ereto, cabeça e olhar dirigidos para a frente, membros superiores ao lado do tronco com as palmas voltadas anteriormente, membros inferiores juntos com os pés apontando para a frente.",
          "Todos os termos de relação são definidos como se o corpo estivesse nessa posição, qualquer que seja a posição real do paciente.",
          "Isso torna a descrição única e sem ambiguidade.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Defina os planos sagital, frontal (coronal) e transverso (axial) e explique o significado de medial, posterior, proximal e distal no laudo.",
        expected: [
          "Plano sagital: vertical, anteroposterior, divide o corpo em partes direita e esquerda (o mediano passa pela linha mediana).",
          "Plano frontal (coronal): vertical, divide em partes anterior e posterior. Plano transverso (axial): horizontal, divide em partes superior e inferior.",
          "Medial: mais próximo do plano mediano. Posterior: mais próximo do dorso. Proximal: mais próximo da raiz do membro. Distal: mais distante dela.",
          "No caso: o fragmento inferior do fêmur deslocou-se em direção ao plano mediano e para trás; o ferimento está acima do joelho, mais perto do quadril.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d2",
    areaId: "anatomia",
    axisId: "osteologia-geral",
    topic: "Osteologia geral",
    points: 1,
    stem: "Um menino de 9 anos cai da bicicleta apoiando-se sobre a mão estendida. A radiografia do punho mostra fratura que atravessa a lâmina epifisial (placa de crescimento) distal do rádio. A mãe pergunta o que é a “linha escura” perto da extremidade do osso, visível também no punho sadio, e se o braço do filho crescerá normalmente.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Classifique os ossos quanto à forma, com um exemplo de cada tipo, e identifique as partes de um osso longo em crescimento.",
        expected: [
          "Longos (fêmur, úmero), curtos (ossos carpais e tarsais), planos (esterno, ossos da calvária), irregulares (vértebras, ossos da face) e sesamoides (patela).",
          "Osso longo em crescimento: diáfise (corpo, osso compacto e cavidade medular).",
          "Duas epífises (extremidades, osso esponjoso) e metáfises (partes alargadas da diáfise junto às epífises).",
          "Lâminas epifisiais entre epífise e metáfise.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique o papel da lâmina epifisial no crescimento do osso e por que sua lesão preocupa em uma criança.",
        expected: [
          "A lâmina epifisial é cartilagem hialina na qual os condrócitos proliferam e a cartilagem é substituída por osso (ossificação endocondral).",
          "É o que faz o osso crescer em comprimento, e por ser cartilagem aparece escura na radiografia.",
          "Ao fim do crescimento a lâmina ossifica e resta a linha epifisial.",
          "A lesão pode interromper ou desviar o crescimento, com encurtamento ou deformidade angular do membro; por isso a fratura exige redução cuidadosa e acompanhamento.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d3",
    areaId: "anatomia",
    axisId: "osteologia-geral",
    topic: "Remodelação óssea",
    points: 1,
    stem: "Uma mulher de 68 anos, na pós-menopausa há 15 anos, sofre fratura do colo do fêmur após queda da própria altura. A densitometria confirma osteoporose. Após a cirurgia, inicia alendronato, um bisfosfonato que inibe a atividade dos osteoclastos.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Descreva o ciclo de remodelação óssea, indicando o papel de osteoclastos, osteoblastos e osteócitos, e explique por que a queda do estrogênio favorece a osteoporose.",
        expected: [
          "Osteoclastos (multinucleados, da linhagem dos monócitos) reabsorvem a matriz mineralizada.",
          "Em seguida, osteoblastos depositam osteoide, que é mineralizado; os osteoblastos aprisionados na matriz tornam-se osteócitos, que mantêm o tecido e percebem a carga mecânica.",
          "O ciclo é contínuo e acoplado: renova o osso, repara microlesões, adapta à carga e participa do controle do cálcio (PTH aumenta a reabsorção; calcitonina a reduz; vitamina D favorece a mineralização).",
          "O estrogênio limita a atividade e a sobrevida dos osteoclastos; sua queda desequilibra o ciclo a favor da reabsorção, com perda sobretudo no osso esponjoso (vértebras, colo do fêmur, rádio distal).",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Diferencie ossificação intramembranosa e ossificação endocondral, com um exemplo de osso formado por cada processo.",
        expected: [
          "Intramembranosa: o osso forma-se diretamente a partir do mesênquima, sem molde de cartilagem. Exemplos: ossos planos da calvária, clavícula.",
          "Endocondral: o osso substitui um molde de cartilagem hialina, com centros de ossificação primário (diáfise) e secundários (epífises). Exemplos: fêmur, úmero, vértebras.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d4",
    areaId: "anatomia",
    axisId: "cranio",
    topic: "Osteologia do crânio",
    points: 1,
    figureId: "af1",
    stem: "Um jovem de 19 anos recebe uma bolada na região da têmpora direita durante um jogo. Perde a consciência por alguns segundos, recupera-se e volta a conversar normalmente. Duas horas depois apresenta cefaleia intensa, vômitos e sonolência progressiva. A tomografia mostra fratura linear na região do ptério e hematoma extradural (epidural).",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Identifique os ossos numerados 1, 3 e 9 e o osso não numerado situado anteriormente à estrutura 2. Explique o que é o ptério e por que essa região é frágil.",
        expected: [
          "1 é o osso parietal, 3 o esfenoide (asa maior) e 9 o temporal (parte escamosa).",
          "O osso anterior à sutura coronal (2) é o frontal.",
          "O ptério é a área em forma de H na qual esses quatro ossos se encontram, na fossa temporal.",
          "É frágil porque o osso ali é fino.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Indique o vaso lesado nesse tipo de fratura e explique a relação entre a lesão e o hematoma extradural.",
        expected: [
          "A artéria meníngea média (ramo frontal), que percorre a face interna do crânio logo abaixo do ptério, entre o osso e a dura-máter.",
          "A fratura lacera a artéria, e o sangue arterial descola a dura-máter do osso: hematoma extradural.",
          "O hematoma cresce e comprime o encéfalo, o que explica o intervalo lúcido seguido de piora. É uma emergência cirúrgica.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d5",
    areaId: "anatomia",
    axisId: "cranio",
    topic: "Osteologia do crânio",
    points: 1,
    stem: "Um lactente de 4 meses é levado à unidade básica com vômitos e diarreia há dois dias. Ao exame, o pediatra palpa o topo da cabeça e registra: “fontículo (fontanela) anterior deprimido”. A mãe se assusta ao perceber que há uma “parte mole” no crânio do filho.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Diferencie neurocrânio e viscerocrânio quanto à função e cite os ossos que compõem o neurocrânio.",
        expected: [
          "Neurocrânio: caixa que envolve e protege o encéfalo, formada pela calvária e pela base do crânio.",
          "Viscerocrânio: esqueleto da face, que forma as órbitas, a cavidade nasal e a boca.",
          "Neurocrânio, 8 ossos: frontal, occipital, esfenoide e etmoide (ímpares), parietais e temporais (pares).",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Localize os fontículos anterior e posterior em relação aos ossos e suturas, indique a época aproximada de fechamento de cada um e explique a utilidade clínica da palpação do fontículo anterior.",
        expected: [
          "Fontículo anterior: em losango, entre o frontal e os parietais, no encontro das suturas sagital e coronal (futuro bregma). Deixa de ser palpável por volta dos 18 meses.",
          "Fontículo posterior: triangular, entre os parietais e o occipital, no encontro das suturas sagital e lambdóidea (futuro lambda). Começa a fechar nos primeiros meses e não é palpável ao fim do primeiro ano.",
          "Utilidade: fontículo deprimido indica desidratação, como no caso; abaulado, aumento da pressão intracraniana.",
          "A “parte mole” é normal nessa idade.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d6",
    areaId: "anatomia",
    axisId: "contracao",
    topic: "Contração muscular",
    points: 1,
    stem: "Uma mulher de 32 anos procura atendimento por queda das pálpebras e visão dupla, que pioram ao final do dia e melhoram com o repouso. Relata também cansaço para mastigar. Os exames detectam anticorpos contra o receptor nicotínico de acetilcolina, confirmando miastenia gravis. Há melhora evidente com piridostigmina, um inibidor da acetilcolinesterase.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Descreva a transmissão na junção neuromuscular, da chegada do potencial de ação ao terminal do neurônio motor até a despolarização da fibra muscular.",
        expected: [
          "O potencial de ação chega ao terminal do neurônio motor e abre canais de Ca²⁺ dependentes de voltagem.",
          "A entrada de Ca²⁺ promove a fusão das vesículas sinápticas e a liberação de acetilcolina na fenda sináptica.",
          "A acetilcolina liga-se aos receptores nicotínicos da placa motora, que são canais iônicos: entra Na⁺ e surge o potencial de placa.",
          "Atingido o limiar, dispara-se um potencial de ação que se propaga pelo sarcolema e pelos túbulos T. A acetilcolinesterase degrada a acetilcolina e encerra o sinal.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt: "Explique por que a paciente tem fraqueza e por que o fármaco melhora o quadro.",
        expected: [
          "Os anticorpos bloqueiam e destroem os receptores de acetilcolina.",
          "Com menos receptores, o potencial de placa pode não atingir o limiar, sobretudo com o uso repetido, o que explica a fadiga ao longo do dia.",
          "O inibidor da acetilcolinesterase mantém a acetilcolina por mais tempo e em maior concentração na fenda, aumentando a chance de ativar os receptores restantes.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d7",
    areaId: "anatomia",
    axisId: "contracao",
    topic: "Contração muscular",
    points: 1,
    stem: "Um perito examina um corpo cerca de seis horas após a morte e encontra a musculatura rígida, com as articulações difíceis de mobilizar (rigor mortis). Um estudante que acompanha a perícia pergunta por que o músculo fica contraído justamente quando a célula deixa de produzir energia.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Descreva o acoplamento excitação-contração e o ciclo das pontes cruzadas no músculo esquelético, citando: túbulo T, retículo sarcoplasmático, Ca²⁺, troponina, tropomiosina, actina, miosina e ATP.",
        expected: [
          "O potencial de ação percorre o sarcolema e os túbulos T, e o retículo sarcoplasmático libera Ca²⁺ no citosol.",
          "O Ca²⁺ liga-se à troponina C; a tropomiosina se desloca e expõe os sítios de ligação na actina.",
          "A cabeça da miosina, energizada pela hidrólise do ATP, liga-se à actina (ponte cruzada) e executa o movimento de força, puxando o filamento fino em direção ao centro do sarcômero.",
          "Um novo ATP liga-se à miosina e a solta da actina; o ciclo se repete enquanto houver Ca²⁺ e ATP.",
          "No relaxamento, a bomba de Ca²⁺ do retículo (que gasta ATP) recaptura o Ca²⁺, e a tropomiosina volta a cobrir os sítios.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Explique o rigor mortis com base nas funções do ATP na contração e no relaxamento muscular.",
        expected: [
          "O ATP tem duas funções no relaxamento: soltar a miosina da actina e alimentar a bomba que recaptura o Ca²⁺.",
          "Após a morte, o ATP se esgota: o Ca²⁺ permanece no citosol e as pontes cruzadas formadas não se desfazem.",
          "O músculo fica rígido até que as proteínas se degradem.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d8",
    areaId: "anatomia",
    axisId: "miologia",
    topic: "Miologia da face",
    points: 1,
    stem: "Um homem de 45 anos acorda com a boca “torta”: a comissura labial está desviada para a esquerda. Ao exame, não consegue fechar o olho direito, não enruga a testa à direita e a saliva escorre pelo canto direito da boca. A força para morder e a sensibilidade da face estão normais. O diagnóstico é paralisia facial periférica (paralisia de Bell) à direita.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Indique o nervo acometido e relacione cada achado (olho, testa e boca) ao músculo da expressão facial responsável.",
        expected: [
          "Nervo facial (NC VII) direito, que inerva todos os músculos da expressão facial.",
          "Olho: paralisia do orbicular do olho, que fecha as pálpebras. Testa: paralisia do ventre frontal do occipitofrontal.",
          "Boca: paralisia do orbicular da boca, dos músculos que elevam o ângulo da boca (zigomáticos, levantador do ângulo da boca) e do bucinador.",
          "A boca desvia para a esquerda porque os músculos do lado sadio tracionam sem oposição.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique por que a mastigação está preservada, citando os quatro músculos da mastigação, sua inervação e a ação principal de cada um.",
        expected: [
          "Os músculos da mastigação são inervados pelo nervo mandibular (NC V3), ramo do trigêmeo, que não foi acometido.",
          "Temporal: eleva e retrai a mandíbula. Masseter: eleva a mandíbula.",
          "Pterigóideo medial: eleva e ajuda na protrusão e nos movimentos de lateralidade.",
          "Pterigóideo lateral: protrai a mandíbula e participa da abertura da boca.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d9",
    areaId: "anatomia",
    axisId: "miologia",
    topic: "Miologia do pescoço",
    points: 1,
    figureId: "af2",
    stem: "Um lactente de 6 semanas é levado à consulta porque mantém a cabeça inclinada para a direita e a face voltada para a esquerda. A palpação revela um nódulo endurecido no ventre de um músculo à direita do pescoço. O diagnóstico é torcicolo muscular congênito.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Identifique o músculo indicado pelo número 1 e descreva suas fixações e sua inervação.",
        expected: [
          "Músculo esternocleidomastóideo.",
          "Fixações: cabeça esternal no manúbrio do esterno e cabeça clavicular no terço medial da clavícula.",
          "Superiormente, no processo mastoide do temporal e na linha nucal superior.",
          "Inervação: nervo acessório (NC XI), com fibras de C2 e C3.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique a postura da criança a partir da ação unilateral desse músculo e indique o que ocorre quando os dois lados se contraem juntos.",
        expected: [
          "Ação unilateral: inclina a cabeça para o mesmo lado e gira a face para o lado oposto e para cima.",
          "O músculo direito está encurtado por fibrose, por isso a cabeça inclina para a direita e a face volta-se para a esquerda.",
          "Ação bilateral: flexão do pescoço; com a cabeça fixa, eleva o esterno e auxilia a inspiração forçada.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d10",
    areaId: "anatomia",
    axisId: "coluna",
    topic: "Coluna vertebral",
    points: 1,
    stem: "Em um mesmo dia de ambulatório são atendidas três pessoas da mesma família: (I) uma adolescente de 13 anos, cuja triagem escolar mostrou assimetria dos ombros e uma saliência costal ao inclinar o tronco para a frente; (II) sua avó de 74 anos, com osteoporose e “corcunda” progressiva no dorso; (III) sua tia, no terceiro trimestre de gestação, com acentuação da curvatura lombar e lombalgia.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Descreva as curvaturas normais da coluna vertebral do adulto, diferenciando as primárias das secundárias e indicando quando as secundárias aparecem.",
        expected: [
          "Quatro curvaturas no plano sagital: lordose cervical, cifose torácica, lordose lombar e cifose sacral.",
          "Primárias (côncavas anteriormente, presentes desde a vida fetal): torácica e sacral.",
          "Secundárias (côncavas posteriormente): a cervical acentua-se quando o lactente sustenta a cabeça; a lombar, quando passa a ficar em pé e andar.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt: "Defina escoliose, hipercifose e hiperlordose e relacione cada uma à pessoa correspondente.",
        expected: [
          "Escoliose: curvatura lateral anormal com rotação das vértebras; a rotação produz a saliência costal na flexão do tronco. É o caso da adolescente (I).",
          "Hipercifose: aumento da curvatura torácica, por colapso anterior dos corpos vertebrais na osteoporose. É o caso da avó (II).",
          "Hiperlordose: aumento da curvatura lombar; na gestação, compensa o deslocamento anterior do centro de gravidade. É o caso da tia (III).",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d11",
    areaId: "anatomia",
    axisId: "coluna",
    topic: "Coluna vertebral",
    points: 1,
    figureId: "af3",
    stem: "Um homem de 22 anos chega com febre, cefaleia e rigidez de nuca. Diante da suspeita de meningite, indica-se punção lombar. O médico palpa os pontos mais altos das cristas ilíacas, identifica o espaço entre os processos espinhosos de L IV e L V e introduz a agulha na linha mediana.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Identifique as estruturas 6, 7 e 8 e cite, em ordem, as camadas atravessadas pela agulha desde a pele até o espaço subaracnóideo.",
        expected: [
          "6 é o ligamento supraespinal, 7 o ligamento interespinal e 8 o ligamento amarelo.",
          "Ordem: pele, tela subcutânea, ligamento supraespinal, ligamento interespinal, ligamento amarelo.",
          "Em seguida: espaço extradural (gordura e plexo venoso), dura-máter e aracnoide-máter.",
          "Até o espaço subaracnóideo, que contém o líquido cerebrospinal.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Explique por que, no adulto, a punção é feita abaixo de L II e qual é a utilidade das cristas ilíacas como referência.",
        expected: [
          "No adulto a medula espinal termina em geral no nível de L I–L II.",
          "Abaixo disso o espaço subaracnóideo contém apenas a cauda equina, cujas raízes se afastam da agulha, o que reduz o risco de lesão.",
          "A linha que une os pontos mais altos das cristas ilíacas cruza a coluna no nível de L IV, o que permite localizar com segurança os espaços L III–L IV e L IV–L V.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d12",
    areaId: "anatomia",
    axisId: "dorso",
    topic: "Músculos do dorso",
    points: 1,
    stem: "Um homem de 40 anos sente dor lombar súbita ao levantar uma caixa pesada com o tronco fletido. Ao exame há contratura dolorosa da musculatura paravertebral, sem déficit neurológico. O médico explica que a dor vem dos músculos próprios do dorso, e não dos músculos “das costas” que movem o braço.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Diferencie músculos extrínsecos e músculos próprios (intrínsecos) do dorso quanto à função e à inervação, com dois exemplos de cada grupo.",
        expected: [
          "Extrínsecos: superficiais, movem o membro superior (trapézio, latíssimo do dorso, levantador da escápula, romboides) ou as costelas (serráteis posteriores).",
          "São inervados por ramos anteriores de nervos espinais, e o trapézio pelo nervo acessório.",
          "Próprios (intrínsecos): profundos, mantêm a postura e movem a coluna vertebral e a cabeça (esplênios, eretor da espinha, transversoespinais).",
          "São inervados por ramos posteriores dos nervos espinais.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Cite as três colunas do músculo eretor da espinha, de lateral para medial, e descreva sua ação bilateral e unilateral.",
        expected: [
          "De lateral para medial: iliocostal, longuíssimo e espinal.",
          "Ação bilateral: extensão da coluna vertebral e da cabeça.",
          "Controle da flexão do tronco por contração excêntrica, o que explica a lesão ao levantar peso com o tronco fletido.",
          "Ação unilateral: flexão lateral da coluna para o mesmo lado.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d13",
    areaId: "anatomia",
    axisId: "parede-abdominal",
    topic: "Parede abdominal",
    points: 1,
    figureId: "af4",
    stem: "Durante uma laparotomia mediana, o cirurgião incide a linha alba do processo xifoide até abaixo do umbigo. Ao afastar o músculo reto do abdome, pede ao residente que explique por que a face posterior do músculo tem aspecto diferente acima e abaixo da estrutura indicada pelo número 11 na figura.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Identifique a estrutura 11 e descreva a composição das lâminas anterior e posterior da bainha do músculo reto do abdome acima e abaixo dela.",
        expected: [
          "11 é a linha arqueada.",
          "Acima dela: a lâmina anterior é formada pela aponeurose do oblíquo externo e pela lâmina anterior da aponeurose do oblíquo interno.",
          "Acima dela: a lâmina posterior, pela lâmina posterior da aponeurose do oblíquo interno e pela aponeurose do transverso do abdome.",
          "Abaixo dela (cerca do quarto inferior do músculo): as aponeuroses dos três músculos planos passam anteriormente ao reto; não há lâmina posterior, e o músculo repousa sobre a fáscia transversal.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Cite, da superfície para a profundidade, as camadas da parede anterolateral do abdome na região dos músculos planos e explique por que a linha alba é escolhida para a incisão.",
        expected: [
          "Pele, tela subcutânea (camada adiposa e camada membranácea), oblíquo externo, oblíquo interno, transverso do abdome, fáscia transversal, gordura extraperitoneal e peritônio parietal.",
          "A linha alba é a fusão mediana das aponeuroses, com poucos vasos e nervos.",
          "A incisão sangra pouco, não secciona músculo nem nervo e permite acesso amplo e rápido.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d14",
    areaId: "anatomia",
    axisId: "parede-abdominal",
    topic: "Parede abdominal",
    points: 1,
    stem: "Um homem de 24 anos nota um abaulamento na região inguinal direita, que aumenta ao tossir e desce em direção ao escroto. Na cirurgia, o saco herniário é encontrado dentro do funículo espermático, com o colo situado lateralmente aos vasos epigástricos inferiores.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Descreva o canal inguinal: seus dois anéis, suas quatro paredes e seu conteúdo no homem e na mulher.",
        expected: [
          "Passagem oblíqua de cerca de 4 cm, acima da metade medial do ligamento inguinal.",
          "Anel profundo: abertura na fáscia transversal, lateral aos vasos epigástricos inferiores. Anel superficial: abertura na aponeurose do oblíquo externo, junto ao tubérculo púbico.",
          "Paredes: anterior, aponeurose do oblíquo externo; posterior, fáscia transversal reforçada medialmente pela foice inguinal; teto, fibras arqueadas do oblíquo interno e do transverso; assoalho, ligamento inguinal.",
          "Conteúdo: funículo espermático no homem, ligamento redondo do útero na mulher, e o nervo ilioinguinal em ambos.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Diferencie hérnia inguinal indireta e direta quanto ao trajeto e à relação com os vasos epigástricos inferiores e classifique a hérnia do paciente.",
        expected: [
          "Indireta: entra pelo anel inguinal profundo, lateralmente aos vasos epigástricos inferiores, percorre o canal dentro do funículo espermático e pode chegar ao escroto.",
          "A indireta relaciona-se à persistência do processo vaginal e é a mais comum, sobretudo em jovens.",
          "Direta: atravessa a parede posterior do canal, medialmente aos vasos epigástricos inferiores, no trígono inguinal; decorre de fraqueza da parede e é mais comum em homens mais velhos.",
          "A hérnia do paciente é indireta.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "anat-d15",
    areaId: "anatomia",
    axisId: "assoalho-pelvico",
    topic: "Assoalho pélvico",
    points: 1,
    stem: "Uma mulher de 58 anos, com quatro partos vaginais, queixa-se de perda de urina ao tossir e ao espirrar e de sensação de “bola na vagina” ao final do dia. O exame mostra descida da parede vaginal anterior ao esforço e contração fraca da musculatura do assoalho pélvico.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Descreva o diafragma da pelve: os músculos que o compõem, as partes do músculo levantador do ânus, sua inervação e suas funções.",
        expected: [
          "O diafragma da pelve é formado pelo levantador do ânus e pelo isquiococcígeo.",
          "O levantador do ânus tem três partes: puborretal, pubococcígeo e iliococcígeo.",
          "Inervação: ramos anteriores de S3–S4 (nervo para o levantador do ânus) e ramos do nervo pudendo; o isquiococcígeo recebe ramos de S4–S5.",
          "Funções: sustentar as vísceras pélvicas, resistir ao aumento da pressão intra-abdominal (tosse, espirro, esforço) e participar da continência urinária e fecal, relaxando para a micção, a defecação e o parto.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Explique como a lesão dessa musculatura no parto leva aos sintomas da paciente e qual é o papel do músculo puborretal na continência fecal.",
        expected: [
          "No parto vaginal, o pubococcígeo e o puborretal podem ser estirados ou lacerados, e o nervo pudendo pode ser lesado.",
          "A perda de suporte do colo da bexiga e da uretra causa perda de urina ao esforço; a perda de suporte da vagina permite a descida das vísceras (prolapso).",
          "O puborretal forma uma alça posterior à junção anorretal e a traciona para a frente, mantendo o ângulo anorretal.",
          "Seu tônus ajuda a manter a continência fecal; seu relaxamento retifica o ângulo e permite a evacuação.",
        ],
      },
    ],
  },
];
