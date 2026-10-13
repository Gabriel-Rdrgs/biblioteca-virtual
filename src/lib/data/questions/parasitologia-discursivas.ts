import type { BankQuestion } from "@/lib/domain/exam-types";

/**
 * As 15 discursivas do simulado N1 de Parasitologia.
 *
 * `expected` é o padrão de resposta do caderno, quebrado em uma ideia por
 * linha: é com ele que o estudante marca os próprios pontos, já que uma
 * resposta escrita não se corrige por comparação de texto.
 */
export const parasitologiaDiscursivas: BankQuestion[] = [
  {
    kind: "discursiva",
    id: "paras-d1",
    areaId: "parasitologia",
    axisId: "introducao",
    topic: "Introdução à Parasitologia",
    points: 1,
    stem: "Em visita a uma comunidade rural sem rede de esgoto, na qual porcos são criados soltos no peridomicílio, uma equipe de Saúde da Família registra três diagnósticos na mesma semana: um adulto com teníase por Taenia solium, uma criança com infecção por Ascaris lumbricoides e um garimpeiro recém-chegado da Amazônia com malária por Plasmodium vivax.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Defina hospedeiro definitivo e hospedeiro intermediário, identificando-os no ciclo de T. solium. Diferencie parasito monoxeno de heteroxeno e classifique A. lumbricoides e P. vivax.",
        expected: [
          "Hospedeiro definitivo: abriga as formas adultas, capazes de reprodução sexuada, e nele transcorre a maior parte do ciclo.",
          "Hospedeiro intermediário: abriga uma fase curta, porém essencial, em geral com as formas larvárias.",
          "Em T. solium: o ser humano é o definitivo (verme adulto no intestino delgado) e o suíno, o intermediário (cisticercos nos tecidos).",
          "Monoxeno: completa o ciclo em um único hospedeiro — A. lumbricoides.",
          "Heteroxeno: desenvolve-se em dois ou mais hospedeiros de espécies diferentes — P. vivax (ser humano e mosquito Anopheles).",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Diferencie vetor biológico de vetor mecânico, com um exemplo de cada, e explique por que, na malária, se prefere falar em hospedeiro vertebrado e hospedeiro invertebrado.",
        expected: [
          "Vetor biológico: o parasito se desenvolve ou se multiplica em seu interior (Anopheles na malária, triatomíneos na doença de Chagas).",
          "Vetor mecânico: apenas transporta o parasito, sem que ele se modifique (moscas e baratas que carregam cistos e ovos).",
          "Nos plasmódios, o ciclo sexuado ocorre no mosquito e o assexuado, no ser humano.",
          "Como em protozoários não há formas adultas, as definições clássicas confundem; por isso se usam os termos hospedeiro vertebrado e hospedeiro invertebrado (vetor).",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d2",
    areaId: "parasitologia",
    axisId: "giardia-amebiase",
    topic: "Giardíase",
    points: 1,
    figureId: "f1",
    stem: "Uma menina de 3 anos, que frequenta creche em período integral, apresenta há três semanas diarreia com fezes volumosas, gordurosas e muito fétidas, distensão abdominal, flatulência e perda de peso. Não há febre, sangue nem muco nas fezes. O exame de uma amostra de fezes diarreicas, corada com hematoxilina férrica, mostra as formas da Figura 1.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Identifique o parasito e o estágio evolutivo mostrado na figura, descrevendo sua morfologia. Indique o estágio infectante e como a criança provavelmente se infectou.",
        expected: [
          "Giardia duodenalis (sin. G. lamblia, G. intestinalis), estágio de trofozoíto.",
          "Morfologia: piriforme, com simetria bilateral, dois núcleos, disco adesivo ventral, quatro pares de flagelos e corpos parabasais em forma de vírgula.",
          "O estágio infectante é o cisto, oval, com até quatro núcleos, resistente no ambiente.",
          "Infecção por ingestão de cistos em água ou alimentos contaminados, ou transmissão direta pessoa a pessoa (mãos), frequente em creches.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique por que a diarreia é gordurosa e sem sangue e por que um único exame de fezes negativo não exclui o diagnóstico.",
        expected: [
          "Os trofozoítos aderem ao epitélio do duodeno e do jejuno pelo disco adesivo, sem invadir a mucosa: por isso não há sangue nem pus.",
          "Há lesão das microvilosidades, deficiência de dissacaridases (lactase) e má absorção de gorduras e vitaminas lipossolúveis, o que explica a esteatorreia e a perda de peso.",
          "A eliminação de cistos é intermitente: recomendam-se ao menos três amostras colhidas em dias diferentes.",
          "Cistos são pesquisados em fezes formadas (Faust, Hoffman); trofozoítos, em fezes diarreicas.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d3",
    areaId: "parasitologia",
    axisId: "giardia-amebiase",
    topic: "Amebíase",
    points: 1,
    figureId: "f2",
    stem: "Um homem de 34 anos, morador de área sem saneamento básico, apresenta há dez dias dor abdominal em cólica, tenesmo e oito a dez evacuações diárias com muco e sangue. Três semanas depois surgem febre, dor no hipocôndrio direito e hepatomegalia dolorosa. A ultrassonografia mostra lesão única, hipoecoica, no lobo direito do fígado.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Identifique os estágios 1, 2 e 3, indicando qual deles é infectante e por quê. Explique o que a estrutura 4 representa e como o parasito chega a esse órgão.",
        expected: [
          "1 é o cisto maduro, com quatro núcleos: é o estágio infectante, pois resiste ao ambiente e à acidez gástrica.",
          "2 é o cisto imaturo (um ou dois núcleos, vacúolo de glicogênio e corpos cromatoides em forma de charuto).",
          "3 é o trofozoíto, que vive no intestino grosso, sai nas fezes diarreicas e não é infectante.",
          "4 é o abscesso hepático amebiano, a forma extraintestinal mais comum.",
          "Os trofozoítos que invadem a parede do colo alcançam o fígado pela circulação porta.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Explique como o parasito lesa a mucosa do intestino grosso e por que o encontro de cistos tetranucleados nas fezes não basta para afirmar que a espécie é a patogênica.",
        expected: [
          "Os trofozoítos de Entamoeba histolytica aderem ao muco e ao epitélio pela lectina Gal/GalNAc, degradam muco e matriz com cisteína-proteinases e lisam as células por contato (amebaporos).",
          "A necrose se estende lateralmente na submucosa e forma úlceras em “botão de camisa”, com disenteria.",
          "E. dispar, não invasiva, é morfologicamente idêntica.",
          "O laudo “E. histolytica/E. dispar” exige detecção de antígenos ou PCR para definir a espécie; trofozoítos com hemácias fagocitadas sugerem E. histolytica.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d4",
    areaId: "parasitologia",
    axisId: "malaria-chagas",
    topic: "Malária",
    points: 1,
    figureId: "f3",
    stem: "Um garimpeiro de 29 anos retorna de Roraima e, duas semanas depois, apresenta acessos de calafrios, febre alta e sudorese que se repetem a cada 48 horas, além de cefaleia e esplenomegalia. A gota espessa identifica Plasmodium vivax. Recebe cloroquina por três dias e primaquina por sete dias, mas abandona a primaquina no segundo dia. Dois meses depois, sem ter voltado à área endêmica, tem novo episódio idêntico.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Identifique as etapas ou os estágios indicados pelos números 1 a 5 e relacione a etapa 4 com a febre a cada 48 horas.",
        expected: [
          "1: esporozoítos inoculados pela fêmea do mosquito Anopheles durante o repasto sanguíneo.",
          "2: esquizogonia hepática (exoeritrocitária), no interior dos hepatócitos.",
          "3: merozoítos liberados na circulação, que invadem hemácias.",
          "4: esquizogonia sanguínea (eritrocitária): trofozoíto, esquizonte e ruptura da hemácia.",
          "5: gametócitos, estágios infectantes para o mosquito.",
          "A febre coincide com a ruptura sincrônica das hemácias ao final de cada ciclo eritrocitário, que dura 48 horas em P. vivax (febre terçã); merozoítos e hemozoína estimulam citocinas pirogênicas.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Explique o segundo episódio, citando o estágio responsável, que não está representado na figura, e a função de cada um dos dois fármacos prescritos.",
        expected: [
          "Trata-se de recaída, causada por hipnozoítos: formas dormentes que persistem nos hepatócitos em P. vivax e P. ovale e se reativam sem nova picada.",
          "A cloroquina é esquizonticida sanguíneo: elimina as formas eritrocitárias e resolve os sintomas.",
          "A primaquina é hipnozoiticida e garante a cura radical; por ter sido interrompida, os hipnozoítos sobreviveram.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d5",
    areaId: "parasitologia",
    axisId: "malaria-chagas",
    topic: "Doença de Chagas",
    points: 1,
    figureId: "f4",
    stem: "Um menino de 7 anos, morador de casa de pau a pique na zona rural, apresenta febre há duas semanas, edema indolor das duas pálpebras do olho direito e linfonodo pré-auricular aumentado do mesmo lado. A mãe mostra insetos capturados nas frestas da parede do quarto, semelhantes aos da Figura 4. O exame de sangue a fresco revela protozoários flagelados muito móveis.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Identifique os insetos da figura e o sinal ocular do paciente. Descreva o mecanismo de transmissão vetorial, explicando por que a picada, por si só, não inocula o parasito.",
        expected: [
          "São triatomíneos (“barbeiros”), hemípteros hematófagos: A é uma ninfa e B, um adulto; ninfas e adultos de ambos os sexos sugam sangue.",
          "O sinal é o sinal de Romaña (edema bipalpebral unilateral com linfadenopatia satélite), que indica a conjuntiva como porta de entrada.",
          "O inseto defeca durante ou logo após o repasto.",
          "Os tripomastigotas metacíclicos estão nas fezes e na urina do triatomíneo, não na saliva, e penetram pelo orifício da picada quando a pessoa se coça, ou por mucosas íntegras.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Justifique o método diagnóstico usado nesta fase, indique como é feito o diagnóstico na fase crônica e cite as formas clínicas crônicas da doença.",
        expected: [
          "Na fase aguda a parasitemia é alta: usam-se métodos parasitológicos diretos (exame a fresco, gota espessa, esfregaço e métodos de concentração).",
          "Na fase crônica a parasitemia é baixa: o diagnóstico é sorológico, com pesquisa de IgG por dois métodos de princípios diferentes (ELISA, imunofluorescência indireta, hemaglutinação indireta).",
          "Xenodiagnóstico, hemocultura e PCR são complementares.",
          "Formas crônicas: indeterminada (assintomática), cardíaca (miocardiopatia dilatada, arritmias, bloqueios) e digestiva (megaesôfago e megacólon).",
          "O tratamento etiológico é feito com benznidazol.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d6",
    areaId: "parasitologia",
    axisId: "leishmania-toxo",
    topic: "Leishmaniose",
    points: 1,
    figureId: "f5",
    stem: "Um trabalhador de 41 anos, que atua na extração de madeira na Amazônia, nota uma pápula no antebraço que, em dois meses, evolui para úlcera arredondada, indolor, de bordas elevadas e fundo granuloso. A lesão não melhora com antibióticos. Na Figura 5, A e B mostram lesões semelhantes às do paciente; C mostra o aspecto seis meses depois do tratamento.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Indique a hipótese diagnóstica, o vetor e o estágio inoculado. Descreva o que ocorre com o parasito no hospedeiro vertebrado depois da inoculação.",
        expected: [
          "Leishmaniose tegumentar (forma cutânea localizada), causada no Brasil principalmente por Leishmania (Viannia) braziliensis.",
          "O vetor é a fêmea de flebotomíneos do gênero Lutzomyia (mosquito-palha), que inocula promastigotas metacíclicos.",
          "Os promastigotas são fagocitados por macrófagos e, dentro do fagolisossomo, transformam-se em amastigotas.",
          "As amastigotas multiplicam-se por divisão binária, rompem a célula e infectam novos macrófagos.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Cite como o diagnóstico é confirmado e o fármaco de primeira escolha. Explique por que o paciente deve ser acompanhado depois da cicatrização.",
        expected: [
          "Confirmação pela demonstração de amastigotas em material da borda da lesão (escarificação, punção ou biópsia), cultura ou PCR.",
          "A intradermorreação de Montenegro, teste de hipersensibilidade tardia, auxilia o diagnóstico.",
          "Tratamento de primeira escolha: antimonial pentavalente (antimoniato de meglumina); a anfotericina B é alternativa.",
          "Na infecção por L. braziliensis o parasito pode disseminar-se e, meses ou anos depois da cura da lesão cutânea, causar a forma mucosa, com destruição do septo nasal e do palato.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d7",
    areaId: "parasitologia",
    axisId: "leishmania-toxo",
    topic: "Toxoplasmose",
    points: 1,
    figureId: "f6",
    stem: "Uma gestante de 26 anos tinha, na oitava semana, sorologia para Toxoplasma gondii com IgM e IgG negativas. Na 16ª semana, o exame mostra IgM positiva e IgG positiva com baixa avidez. Ela adotou recentemente um filhote de gato que caça no quintal, cuida de uma horta sem luvas e costuma comer carne malpassada.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Identifique o hospedeiro definitivo e explique o que ocorre nas etapas A, B e C. Cite os três estágios infectantes e as vias pelas quais a gestante pode ter se infectado.",
        expected: [
          "Os hospedeiros definitivos são os felídeos.",
          "No epitélio intestinal do gato ocorrem a esquizogonia (A) e a gametogonia (B), com formação de oocistos eliminados nas fezes.",
          "No solo ocorre a esporogonia (C): em poucos dias o oocisto esporula e torna-se infectante.",
          "Estágios infectantes: oocistos esporulados (solo, água, verduras, mãos), bradizoítos em cistos teciduais (carne crua ou malcozida) e taquizoítos (via transplacentária).",
          "A gestante pode ter se infectado pela horta, pelo contato com fezes do gato ou pela carne.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Interprete o perfil sorológico, explique o risco para o feto e cite a conduta medicamentosa na gestação.",
        expected: [
          "Houve soroconversão durante a gestação, e a IgG de baixa avidez indica infecção primária recente.",
          "Na infecção aguda materna os taquizoítos circulantes podem atravessar a placenta.",
          "A toxoplasmose congênita pode causar coriorretinite, calcificações intracranianas, hidrocefalia e retardo do desenvolvimento.",
          "Usa-se espiramicina para reduzir o risco de transmissão ao feto; a infecção congênita confirmada é tratada com sulfadiazina, pirimetamina e ácido folínico.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d8",
    areaId: "parasitologia",
    axisId: "tricomoniase",
    topic: "Tricomoníase",
    points: 1,
    figureId: "f7",
    stem: "Uma mulher de 24 anos queixa-se de corrimento vaginal amarelo-esverdeado, bolhoso e de odor fétido, com prurido, ardor ao urinar e dor na relação sexual. O exame especular mostra colo com pontilhado hemorrágico e o pH vaginal é 6,0. O exame a fresco revela protozoários flagelados móveis; o esfregaço corado pelo Giemsa é mostrado na Figura 7. O parceiro não tem sintomas.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Identifique o parasito, descreva a morfologia do estágio observado e explique por que a transmissão depende de contato direto.",
        expected: [
          "Trichomonas vaginalis, no estágio de trofozoíto.",
          "Morfologia: piriforme ou pleomórfico, com um núcleo, quatro flagelos anteriores livres, membrana ondulante e axóstilo.",
          "Não tem mitocôndrias; o citoplasma contém hidrogenossomos.",
          "Não existe forma cística: o trofozoíto é o único estágio e é também o infectante. Como resiste pouco fora do hospedeiro, a transmissão é essencialmente sexual.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Relacione o pH vaginal da paciente com a infecção. Indique o tratamento e justifique a conduta em relação ao parceiro.",
        expected: [
          "O pH vaginal normal (3,8 a 4,4), mantido pelo ácido láctico produzido pelos lactobacilos, é hostil ao parasito, que se desenvolve bem em pH entre 5,0 e 7,5.",
          "A elevação do pH favorece a colonização.",
          "Tratamento com 5-nitroimidazólicos: metronidazol (2 g em dose única ou 500 mg duas vezes ao dia por sete dias) ou tinidazol.",
          "O parceiro deve ser tratado ao mesmo tempo, mesmo assintomático: homens albergam o parasito na uretra e na próstata e reinfectam a parceira.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d9",
    areaId: "parasitologia",
    axisId: "tenia",
    topic: "Teníase e cisticercose",
    points: 1,
    figureId: "f8",
    stem: "Um agricultor de 38 anos, que cria porcos soltos e mora em casa sem fossa, conta que há meses elimina “pedaços brancos” nas fezes. Sua filha de 12 anos, que não come carne de porco, tem a primeira crise convulsiva; a tomografia mostra lesões císticas com escólex no interior e calcificações. As proglotes eliminadas pelo pai têm o aspecto da estrutura 3 da Figura 8.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Diferencie as duas espécies de Taenia pelo escólex e pela proglote grávida, identificando as estruturas 1 a 4, e indique a espécie que parasita o pai.",
        expected: [
          "1: escólex de T. solium — quatro ventosas e rostelo com coroa de ganchos (acúleos).",
          "2: escólex de T. saginata — quatro ventosas, sem rostelo nem ganchos.",
          "3: proglote grávida de T. solium — 7 a 12 ramificações uterinas de cada lado, de padrão dendrítico.",
          "4: proglote grávida de T. saginata — 15 a 30 ramificações de cada lado, de padrão dicotômico.",
          "O pai alberga T. solium.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique como pai e filha adquiriram doenças diferentes causadas pelo mesmo parasito e por que tratar o pai protege a família.",
        expected: [
          "O pai tem teníase: ingeriu carne suína crua ou malcozida com cisticercos e desenvolveu o verme adulto no intestino delgado (ser humano como hospedeiro definitivo).",
          "A filha tem cisticercose: ingeriu ovos de T. solium eliminados por um portador, em água, alimentos ou mãos contaminados.",
          "As oncosferas atravessam a mucosa intestinal e, pela circulação, alcançam o sistema nervoso central, os músculos e os olhos, onde formam cisticercos (hospedeiro intermediário acidental).",
          "O portador do verme adulto é a fonte de ovos para os familiares e para os porcos; tratá-lo (praziquantel ou albendazol) interrompe a transmissão, junto com saneamento e cozimento da carne.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d10",
    areaId: "parasitologia",
    axisId: "esquistossomose",
    topic: "Esquistossomose",
    points: 1,
    figureId: "f9",
    stem: "Um homem de 35 anos, natural da Zona da Mata nordestina, onde se banhava em lagoas na infância, é internado com vômitos de sangue. Apresenta baço muito aumentado e circulação colateral no abdome, sem icterícia; as provas de função hepática são normais. A endoscopia mostra varizes de esôfago e a ultrassonografia, fibrose periportal. A biópsia hepática é mostrada na Figura 9.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Descreva o ciclo de Schistosoma mansoni, da eliminação dos ovos nas fezes até a instalação dos vermes adultos no ser humano.",
        expected: [
          "Os ovos eliminados nas fezes alcançam a água doce e liberam o miracídio, larva ciliada que penetra em caramujos do gênero Biomphalaria.",
          "No caramujo formam-se esporocistos, que originam numerosas cercárias.",
          "As cercárias, de cauda bifurcada, saem do caramujo, nadam e penetram ativamente a pele, transformando-se em esquistossômulos.",
          "Estes ganham a circulação, passam pelos pulmões e chegam ao sistema porta intra-hepático, onde amadurecem e se acasalam.",
          "Os casais migram para as vênulas mesentéricas, onde a fêmea põe os ovos; parte deles atravessa a parede intestinal e sai nas fezes.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Identifique a lesão mostrada na figura e explique como ela leva à hipertensão portal com função hepática preservada.",
        expected: [
          "A figura mostra o granuloma em torno do ovo, lesão básica da esquistossomose crônica: reação de hipersensibilidade aos antígenos secretados pelo miracídio.",
          "Os ovos que não são eliminados são levados pela corrente portal e ficam retidos nos ramos intra-hepáticos da veia porta.",
          "A cicatrização dos granulomas produz fibrose periportal (fibrose de Symmers), que obstrui o fluxo portal antes dos sinusoides.",
          "A obstrução pré-sinusoidal causa hipertensão portal, esplenomegalia e varizes esofágicas, enquanto os hepatócitos são poupados: por isso a função hepática é normal.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d11",
    areaId: "parasitologia",
    axisId: "larva-migrans",
    topic: "Larva migrans cutânea",
    points: 1,
    figureId: "f10",
    stem: "Uma menina de 6 anos volta das férias em uma praia frequentada por cães e gatos, onde brincava descalça na areia seca. Dez dias depois surgem nos pés lesões lineares e sinuosas, avermelhadas e elevadas, com prurido intenso, que avançam alguns milímetros a cada dia. A mãe pede um exame de fezes “para ver o verme”.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Indique o diagnóstico e os agentes etiológicos. Explique como a criança se infectou, descrevendo o ciclo do parasito em seu hospedeiro habitual.",
        expected: [
          "Larva migrans cutânea (bicho geográfico, dermatite serpiginosa), causada por larvas de Ancylostoma braziliense (cães e gatos) e A. caninum (cães).",
          "Os vermes adultos vivem no intestino delgado de cães e gatos, que eliminam ovos nas fezes.",
          "No solo arenoso, úmido e sombreado, os ovos liberam larvas rabditoides, que evoluem para larvas filarioides infectantes.",
          "Estas penetraram ativamente a pele da criança em contato com a areia.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique por que o parasito permanece na pele do ser humano e por que o exame de fezes pedido pela mãe não ajuda. Cite o tratamento e duas medidas de prevenção.",
        expected: [
          "O ser humano é hospedeiro acidental: as larvas não conseguem atravessar a pele até a circulação e migram pela epiderme, abrindo túneis, até morrerem em semanas ou meses.",
          "Como não há vermes adultos no intestino humano, não há ovos nas fezes; o diagnóstico é clínico, pelo aspecto da lesão e pela história de exposição.",
          "Tratamento: albendazol ou ivermectina por via oral; tiabendazol tópico é alternativa.",
          "Prevenção: tratar cães e gatos com anti-helmínticos, impedir seu acesso a praias e tanques de areia e usar calçados.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d12",
    areaId: "parasitologia",
    axisId: "ascaris-enterobius",
    topic: "Ascaridíase",
    points: 1,
    stem: "Um menino de 4 anos, morador de bairro sem rede de esgoto e com hábito de levar terra à boca, teve há um mês tosse seca, chiado e febre baixa por uma semana; o hemograma mostrava 18% de eosinófilos e a radiografia, infiltrados pulmonares que desapareceram sem tratamento. Agora apresenta dor abdominal em cólica, distensão, vômitos e parada de eliminação de fezes. Durante um vômito, elimina pela boca um verme cilíndrico de cerca de 20 cm.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Descreva o ciclo de Ascaris lumbricoides, da ingestão do ovo até o verme adulto, e relacione o quadro respiratório de um mês atrás com esse ciclo.",
        expected: [
          "Os ovos embrionados ingeridos liberam larvas no intestino delgado.",
          "As larvas atravessam a mucosa, chegam ao fígado pela circulação porta e, em seguida, ao coração direito e aos pulmões.",
          "Ali rompem os capilares, caem nos alvéolos, sobem pela árvore brônquica até a faringe e são deglutidas (ciclo pulmonar).",
          "De volta ao intestino delgado, tornam-se adultos.",
          "A tosse, o chiado, os infiltrados pulmonares transitórios e a eosinofilia correspondem à síndrome de Loeffler, causada pela passagem das larvas pelos pulmões.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique o quadro abdominal atual e a saída do verme pela boca. Explique também por que os ovos recém-eliminados nas fezes não são infectantes e o que isso implica para a transmissão.",
        expected: [
          "Em infecções com muitos vermes, os adultos se enovelam e obstruem o lúmen do intestino delgado (oclusão por “bolo de áscaris”).",
          "Os adultos também fazem migrações erráticas, saindo pela boca ou pelas narinas ou entrando nas vias biliares e no apêndice.",
          "Os ovos saem nas fezes não embrionados e precisam de cerca de três semanas no solo úmido e aquecido para se tornarem infectantes.",
          "Por isso não há transmissão direta de pessoa a pessoa: a infecção depende da contaminação do solo com fezes (geo-helmintíase) e ocorre por mãos sujas de terra, água e hortaliças.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d13",
    areaId: "parasitologia",
    axisId: "ascaris-enterobius",
    topic: "Enterobíase",
    points: 1,
    figureId: "f11",
    stem: "Uma menina de 5 anos tem prurido anal intenso, sobretudo à noite, com sono agitado e irritabilidade. Dois exames parasitológicos de fezes por sedimentação foram negativos. A mãe viu “fiapos de linha branca” se movendo ao redor do ânus da criança durante a noite. O pediatra solicita outro exame, colhido pela manhã, antes do banho, cujo resultado é mostrado na Figura 11. A criança divide a cama com o irmão.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Identifique o parasito e o método utilizado, descrevendo as estruturas observadas. Explique por que os exames de fezes anteriores foram negativos.",
        expected: [
          "Enterobius vermicularis (oxiúro). O método é o da fita adesiva (método de Graham), aplicada à pele perianal e transferida para uma lâmina.",
          "Observam-se ovos alongados, assimétricos, com um dos lados achatado, de casca fina e transparente, contendo uma larva.",
          "Os adultos vivem no ceco; as fêmeas grávidas migram à noite para a região perianal, onde liberam os ovos, que ficam aderidos à pele.",
          "Como os ovos não são postos no lúmen intestinal, raramente aparecem nas fezes.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique os mecanismos de transmissão que mantêm a infecção na criança e na família e justifique a conduta terapêutica.",
        expected: [
          "Os ovos tornam-se infectantes em poucas horas.",
          "A criança se reinfecta ao coçar a região e levar a mão à boca (autoinfecção externa); larvas que eclodem na região perianal podem voltar ao reto (retroinfecção).",
          "Os conviventes se infectam por ovos nas roupas de cama, na poeira e em objetos (heteroinfecção).",
          "Tratam-se a criança e todos os conviventes ao mesmo tempo, com albendazol, mebendazol ou pamoato de pirantel, repetindo a dose após duas semanas.",
          "Associam-se medidas de higiene: unhas curtas, banho pela manhã e troca frequente das roupas de cama, sem sacudi-las.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d14",
    areaId: "parasitologia",
    axisId: "ancilostoma-strongyloides",
    topic: "Ancilostomíase",
    points: 1,
    stem: "Um lavrador de 45 anos, que trabalha descalço, queixa-se de cansaço, falta de ar aos esforços e palpitações e conta que sente vontade de comer terra. Está muito pálido e tem edema nas pernas. O hemograma mostra hemoglobina de 6,2 g/dL, com hemácias microcíticas e hipocrômicas, ferritina baixa e eosinofilia. O exame de fezes revela ovos elípticos, de casca fina, com blastômeros no interior. Ele lembra que, no início, sentia coceira entre os dedos dos pés.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Descreva o ciclo dos ancilostomídeos humanos e diferencie Ancylostoma duodenale de Necator americanus quanto à cápsula bucal e às vias de infecção.",
        expected: [
          "Os ovos eliminados nas fezes liberam, no solo, larvas rabditoides, que evoluem em alguns dias para larvas filarioides infectantes.",
          "Estas penetram ativamente a pele (causando a dermatite nos pés), ganham a circulação, fazem o ciclo pulmonar, são deglutidas e tornam-se adultos no intestino delgado.",
          "A. duodenale: cápsula bucal com dois pares de dentes; infecta pela pele e também por via oral.",
          "N. americanus: cápsula bucal com lâminas cortantes; infecta apenas pela pele.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt: "Explique o mecanismo da anemia do paciente e indique a conduta.",
        expected: [
          "Os vermes adultos fixam-se à mucosa do duodeno e do jejuno com a cápsula bucal, laceram capilares, sugam sangue e secretam anticoagulantes.",
          "Ao mudar de lugar, deixam pontos sangrantes.",
          "A perda crônica de sangue esgota as reservas de ferro e causa anemia ferropriva (microcítica e hipocrômica) e hipoalbuminemia, com edema.",
          "Conduta: anti-helmíntico (albendazol ou mebendazol) e reposição de ferro. Prevenção: uso de calçados e destino adequado das fezes.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "paras-d15",
    areaId: "parasitologia",
    axisId: "ancilostoma-strongyloides",
    topic: "Estrongiloidíase",
    points: 1,
    figureId: "f12",
    stem: "Uma mulher de 52 anos, criada na zona rural, tinha há anos dor epigástrica e eosinofilia nunca investigadas. Para tratar uma doença autoimune, recebe prednisona em dose alta. Três semanas depois apresenta diarreia, dor abdominal, tosse e falta de ar, com infiltrados pulmonares difusos, e evolui com sepse por Escherichia coli. O exame do escarro mostra larvas de nematódeo.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Identifique os estágios ou as etapas indicados pelos números 1, 3, 4, 6 e 7 e explique por que esta infecção pode persistir por décadas sem nova exposição.",
        expected: [
          "1: larva filarioide, infectante, que penetra a pele.",
          "3: fêmeas partenogenéticas na mucosa do intestino delgado.",
          "4: larvas rabditoides eliminadas nas fezes.",
          "6: autoinfecção interna. 7: autoinfecção externa.",
          "Os ovos eclodem ainda no intestino; parte das larvas rabditoides transforma-se em filarioides antes de sair e penetra a mucosa do colo (interna) ou a pele perianal (externa).",
          "Assim o parasito se multiplica dentro do hospedeiro, o que não ocorre com os outros nematódeos intestinais.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Explique o quadro atual da paciente, incluindo a sepse. Indique o método adequado para o diagnóstico nas fezes e a conduta que teria evitado a complicação.",
        expected: [
          "A imunossupressão por corticoide acelera a autoinfecção interna: ocorre hiperinfecção, com grande número de larvas no intestino e nos pulmões, e disseminação para outros órgãos.",
          "Ao atravessar a parede intestinal, as larvas carregam bactérias entéricas, causando sepse por Gram-negativos.",
          "Nas fezes pesquisam-se larvas, e não ovos, pelos métodos de Baermann ou de Rugai, baseados na migração das larvas para a água aquecida.",
          "Pessoas de áreas endêmicas devem ser investigadas e tratadas com ivermectina antes de iniciar imunossupressores.",
        ],
      },
    ],
  },
];
