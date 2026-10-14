import type { BankQuestion } from "@/lib/domain/exam-types";

/**
 * As 15 discursivas do simulado N1 de Iniciação Científica I.
 *
 * `expected` é o padrão de resposta do caderno, uma ideia por linha, para o
 * estudante marcar os próprios pontos item a item.
 */
export const icDiscursivas: BankQuestion[] = [
  {
    kind: "discursiva",
    id: "ic-d1",
    areaId: "iniciacao-cientifica",
    axisId: "ciencia-conhecimento",
    topic: "Conhecimento científico",
    points: 1,
    stem: "Na sala de espera de uma Unidade Básica de Saúde, uma senhora de 63 anos conta que trata a gastrite com chá de boldo, “porque minha avó sempre usou e nunca falhou”. O agente comunitário mostra no celular o vídeo de um influenciador garantindo que o chá “mata a bactéria do estômago”. O médico de família explica que a infecção por Helicobacter pylori deve ser tratada com o esquema de antibióticos cuja eficácia foi demonstrada em ensaios clínicos, e acrescenta que essa recomendação pode mudar se novos estudos mostrarem aumento da resistência bacteriana.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Diferencie conhecimento popular, religioso, filosófico e científico e classifique as três fontes de informação citadas no caso.",
        expected: [
          "Popular (senso comum): transmitido pela tradição e pela experiência cotidiana; valorativo, assistemático, sem método nem controle.",
          "Religioso (teológico): apoia-se na fé e na revelação; é dogmático e não verificável.",
          "Filosófico: racional e sistemático, fruto da reflexão, mas não verificável pela experiência.",
          "Científico: real (factual), sistemático, verificável, contingente, falível e aproximadamente exato; obtido por método explícito.",
          "No caso: a experiência da avó é conhecimento popular; o vídeo do influenciador é opinião sem método; o tratamento demonstrado em ensaios clínicos é conhecimento científico.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique por que o conhecimento científico é considerado falível e provisório e por que, mesmo assim, é o mais adequado para fundamentar condutas clínicas.",
        expected: [
          "É falível porque toda conclusão é provisória: novos dados, métodos ou instrumentos podem refutá-la ou reformulá-la.",
          "A recomendação sobre H. pylori pode mudar com a resistência bacteriana.",
          "Mesmo assim é o mais adequado porque usa método explícito e reprodutível, controla vieses, quantifica a incerteza e passa pela crítica da comunidade (revisão por pares, replicação).",
          "A capacidade de se autocorrigir é sua força, e não sua fraqueza.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d2",
    areaId: "iniciacao-cientifica",
    axisId: "ciencia-conhecimento",
    topic: "Método científico",
    points: 1,
    figureId: "ic-f1",
    stem: "Em 1847, em um hospital de Viena, o médico Ignaz Semmelweis notou que a mortalidade por febre puerperal era muito maior na clínica obstétrica atendida por médicos e estudantes, que vinham das salas de necropsia, do que na clínica atendida por parteiras. Após a morte de um colega que se feriu durante uma necropsia e adoeceu como as puérperas, supôs que “partículas cadavéricas” levadas pelas mãos causavam a doença. Instituiu a lavagem das mãos com solução clorada antes dos partos, e a mortalidade caiu drasticamente. Seus resultados, porém, foram recebidos com resistência pelos colegas.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Identifique as etapas 1 a 6 da Figura 1 e relacione cada uma ao trabalho de Semmelweis.",
        expected: [
          "1 Observação: mortalidade diferente entre as duas clínicas.",
          "2 Problema (pergunta): por que morrem mais puérperas na clínica dos médicos?",
          "3 Hipótese: partículas cadavéricas transportadas pelas mãos causam a febre puerperal.",
          "4 Experimentação (teste): lavagem das mãos com solução clorada.",
          "5 Análise dos resultados: comparação das taxas de mortalidade antes e depois, com queda acentuada.",
          "6 Conclusão e comunicação: divulgação dos achados; a resistência dos colegas mostra que o conhecimento também depende da crítica e da aceitação da comunidade. O ciclo recomeça com novas perguntas.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Diferencie o método indutivo do hipotético-dedutivo e classifique a pesquisa de Semmelweis quanto à natureza e à abordagem.",
        expected: [
          "Indutivo: parte de observações particulares para chegar a generalizações; a generalização pode ser derrubada por um único caso contrário.",
          "Hipotético-dedutivo (Popper): parte de um problema, propõe uma hipótese (conjectura), deduz consequências testáveis e tenta refutá-las; a hipótese que resiste aos testes é aceita provisoriamente.",
          "Semmelweis seguiu o modelo hipotético-dedutivo.",
          "Natureza: aplicada (resolve um problema prático). Abordagem: quantitativa (compara taxas de mortalidade).",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d3",
    areaId: "iniciacao-cientifica",
    axisId: "mbe",
    topic: "Medicina baseada em evidências",
    points: 1,
    stem: "Dona Helena, 74 anos, tem fibrilação atrial não valvar e indicação de anticoagulação oral para prevenir acidente vascular cerebral (AVC). Mora na zona rural, a 60 km do laboratório mais próximo, e diz que não conseguiria fazer exames de sangue frequentes para ajustar a dose do remédio. O residente lembra que o preceptor “sempre prescreve varfarina”, mas decide procurar a melhor evidência disponível antes de discutir as opções com a paciente.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Defina medicina baseada em evidências (MBE) e descreva seus três componentes, relacionando cada um ao caso.",
        expected: [
          "MBE é o uso consciencioso, explícito e criterioso da melhor evidência científica disponível na tomada de decisão sobre o cuidado de pacientes individuais (Sackett, 1996).",
          "Melhor evidência disponível: os estudos que compararam os anticoagulantes.",
          "Experiência clínica: avaliar risco de sangramento, função renal, interações e adesão.",
          "Valores, preferências e circunstâncias do paciente: a distância do laboratório e a dificuldade de fazer controles frequentes.",
          "O hábito (“sempre prescreve”) ou a autoridade não substituem a evidência; a MBE também não é “receita”: integra os três componentes.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Formule a pergunta clínica do caso no formato PICO e cite, em ordem, as cinco etapas da prática da MBE.",
        expected: [
          "P: idosos com fibrilação atrial não valvar; I: anticoagulante oral direto (por exemplo, apixabana); C: varfarina; O: AVC ou embolia sistêmica e sangramento maior.",
          "(1) Formular a pergunta clínica estruturada.",
          "(2) Buscar a melhor evidência.",
          "(3) Avaliar criticamente validade, relevância e aplicabilidade.",
          "(4) Aplicar, integrando experiência clínica e valores do paciente.",
          "(5) Avaliar o resultado e o próprio desempenho.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d4",
    areaId: "iniciacao-cientifica",
    axisId: "tipos-pesquisa",
    topic: "Pirâmide de evidências",
    points: 1,
    figureId: "ic-f2",
    stem: "Para responder à pergunta “a suplementação de ácido fólico antes da concepção reduz os defeitos do tubo neural?”, uma estudante reúne: a opinião de um especialista publicada em um blog, um relato de caso, um estudo transversal, um estudo de caso-controle, uma coorte, um ensaio clínico randomizado e uma revisão sistemática com metanálise de ensaios clínicos. A professora pede que ela organize o material na pirâmide de evidências da Figura 2.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Identifique os níveis 1 a 7 da pirâmide e explique o critério que ordena os delineamentos.",
        expected: [
          "1 revisão sistemática com metanálise; 2 ensaio clínico randomizado; 3 coorte; 4 caso-controle; 5 estudo transversal; 6 relatos e séries de casos; 7 opinião de especialistas, estudos em animais e in vitro.",
          "Critério: do topo para a base diminui a capacidade do delineamento de controlar vieses e de sustentar inferência causal (randomização, grupo comparador, sequência temporal, controle do pesquisador sobre a exposição).",
          "No topo está a evidência que gera maior confiança na estimativa do efeito.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique, com dois exemplos, por que a pirâmide não deve ser aplicada de forma mecânica.",
        expected: [
          "A qualidade conta: um ensaio com falhas graves (sem sigilo de alocação, grandes perdas) pode valer menos que uma coorte bem conduzida; uma revisão de estudos ruins é uma revisão ruim.",
          "A pergunta define o melhor desenho: prognóstico e fatores de risco pedem coortes; efeitos adversos raros, caso-controle; prevalência, estudo transversal; exposições nocivas (como o tabagismo) não podem ser testadas eticamente em ensaios.",
          "Sistemas como o GRADE graduam a certeza da evidência considerando esses fatores.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d5",
    areaId: "iniciacao-cientifica",
    axisId: "tipos-pesquisa",
    topic: "Estudos observacionais",
    points: 1,
    figureId: "ic-f3",
    stem: "Em 1950, Richard Doll e Austin Bradford Hill compararam pacientes internados com câncer de pulmão a pacientes internados por outras doenças, perguntando a todos sobre o hábito de fumar. Pouco depois, enviaram questionários a milhares de médicos britânicos, classificaram-nos conforme o tabagismo e passaram a registrar as mortes ao longo dos anos. Os dois estudos apontaram a mesma associação. A Figura 3 esquematiza os dois delineamentos.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Identifique os delineamentos A e B, explicando o ponto de partida, a direção temporal e a medida de associação típica de cada um. Indique qual estudo de Doll e Hill corresponde a cada esquema.",
        expected: [
          "A, coorte: parte da exposição; pessoas sem a doença, classificadas em expostas e não expostas, são acompanhadas no tempo até o desfecho. Mede a incidência em cada grupo e calcula o risco relativo (RR). Corresponde ao estudo dos médicos britânicos.",
          "B, caso-controle: parte do desfecho; pessoas com a doença (casos) e sem a doença (controles) são investigadas quanto à exposição no passado. Não mede incidência e calcula a razão de chances (odds ratio, OR). Corresponde ao estudo de 1950.",
          "Ambos são observacionais: o pesquisador não atribui a exposição.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt: "Cite uma vantagem e uma limitação de cada delineamento.",
        expected: [
          "Coorte: estabelece a sequência temporal e permite estudar vários desfechos; é longa, cara, sujeita a perdas de seguimento e pouco eficiente para doenças raras.",
          "Caso-controle: rápido, barato e adequado a doenças raras ou de longa latência; sujeito a viés de memória e a viés na seleção dos controles.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d6",
    areaId: "iniciacao-cientifica",
    axisId: "tipos-pesquisa",
    topic: "Ensaio clínico randomizado",
    points: 1,
    figureId: "ic-f4",
    stem: "Um grupo quer saber se a suplementação de vitamina D reduz quedas em idosos que vivem na comunidade. Foram incluídos 1.200 idosos, sorteados por computador para receber vitamina D ou uma cápsula idêntica sem princípio ativo; a lista do sorteio ficou com uma central externa, e nem os participantes nem os avaliadores sabiam quem recebia cada cápsula. Ao longo de 24 meses, 90 idosos pararam de tomar as cápsulas, mas continuaram sendo avaliados no grupo para o qual haviam sido sorteados.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Identifique as etapas 1 a 6 da Figura 4 e explique a função da randomização, do sigilo de alocação e do cegamento.",
        expected: [
          "1 população elegível (critérios de inclusão e exclusão, consentimento); 2 randomização; 3 grupo intervenção (vitamina D); 4 grupo controle (placebo); 5 cegamento (duplo-cego); 6 avaliação do desfecho (quedas em 24 meses).",
          "Randomização: distribui ao acaso fatores prognósticos conhecidos e desconhecidos, tornando os grupos comparáveis e controlando a confusão.",
          "Sigilo de alocação: impede que quem inclui o participante conheça ou altere o próximo grupo, evitando viés de seleção.",
          "Cegamento: evita que o conhecimento do grupo influencie cuidados e comportamento (viés de desempenho) e a avaliação do desfecho (viés de aferição).",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Explique por que o estudo é experimental e o que é a análise por intenção de tratar, presente no caso.",
        expected: [
          "É experimental (intervencional) porque o pesquisador decide e atribui a intervenção; nos estudos observacionais, apenas observa exposições que ocorreram naturalmente.",
          "Na análise por intenção de tratar, cada participante é analisado no grupo para o qual foi randomizado, tenha aderido ou não.",
          "Isso preserva os benefícios da randomização e estima a efetividade na prática; excluir os não aderentes reintroduziria viés.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d7",
    areaId: "iniciacao-cientifica",
    axisId: "busca-ia",
    topic: "Busca em bases de dados",
    points: 1,
    stem: "Para o projeto de revisão bibliográfica, Júlia escolheu o tema “tempo de tela e miopia em crianças”. Em um buscador comum da internet, digitou “celular faz mal para os olhos das crianças?” e obteve milhões de resultados, com blogs e anúncios nas primeiras posições. A professora sugere refazer a busca em bases de dados científicas, usando descritores e operadores booleanos.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Diferencie descritores controlados (DeCS e MeSH) de palavras-chave livres e monte uma estratégia de busca para o tema com AND e OR, explicando a função de cada operador e do NOT.",
        expected: [
          "Descritores são termos de vocabulário controlado e hierarquizado, usados para indexar os artigos: MeSH (da National Library of Medicine, no PubMed/MEDLINE) e DeCS (da BIREME, multilíngue e baseado no MeSH, na BVS/LILACS). Recuperam artigos pelo conceito, independentemente da palavra usada pelos autores.",
          "Palavras-chave livres são termos do título e do resumo; captam sinônimos e artigos ainda não indexados. O ideal é combinar os dois.",
          "Exemplo: (“Screen Time” OR smartphone OR “digital devices”) AND (Myopia OR myop*) AND (Child OR Adolescent).",
          "OR soma sinônimos e amplia; AND exige todos os conceitos e restringe; NOT exclui um termo e deve ser usado com cautela, pois pode eliminar artigos relevantes.",
          "Aspas buscam a expressão exata; o asterisco trunca o termo.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Indique três bases de dados adequadas, descrevendo o que cada uma reúne, e explique por que o buscador comum não é suficiente.",
        expected: [
          "PubMed: acesso gratuito ao MEDLINE, literatura biomédica mundial.",
          "LILACS (via BVS): produção científica e técnica da América Latina e do Caribe. SciELO: periódicos de acesso aberto do Brasil e de outros países. Cochrane Library: revisões sistemáticas e registro de ensaios clínicos.",
          "O buscador comum ordena os resultados por popularidade e publicidade, e não por qualidade; não tem curadoria, vocabulário controlado nem filtros por tipo de estudo; mistura opinião e evidência.",
          "Uma busca científica precisa ser sistemática, documentada e reprodutível.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d8",
    areaId: "iniciacao-cientifica",
    axisId: "busca-ia",
    topic: "Inteligência artificial",
    points: 1,
    stem: "Pedro usou um chatbot de inteligência artificial (IA) para escrever a introdução do seu projeto. O texto ficou fluente e trazia oito referências completas, com autores, revista, ano e DOI. Ao conferir no PubMed, a professora descobriu que três artigos não existiam e que um DOI levava a um artigo sobre outro tema. Pedro argumenta que “a IA consultou a internet, então deve estar certa”.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Explique por que modelos de linguagem podem produzir referências falsas e descreva como verificar uma referência.",
        expected: [
          "Modelos de linguagem geram o texto mais provável a partir de padrões aprendidos; não “sabem” se uma referência existe.",
          "Podem combinar autores, títulos e DOIs de forma plausível, porém inventada (as chamadas “alucinações”). Plausibilidade não é veracidade, e a responsabilidade pelo texto é sempre do autor.",
          "Verificação: buscar o título exato nas bases (PubMed, SciELO, Google Acadêmico); abrir o DOI e conferir se leva ao artigo indicado; conferir autores, revista, ano e volume; ler o original e confirmar que ele sustenta a afirmação.",
          "Nunca citar o que não foi lido.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Cite dois usos adequados e dois usos inadequados da IA na pesquisa e explique se a IA pode figurar como autora de um trabalho.",
        expected: [
          "Adequados: sugerir descritores e sinônimos para a busca; organizar ideias e revisar gramática e clareza; explicar conceitos durante o estudo; resumir artigos que o estudante leu, conferindo o resumo.",
          "Inadequados: gerar referências ou dados sem verificação; apresentar texto gerado como próprio sem declarar o uso; inserir dados identificáveis de pacientes; aceitar sem crítica a interpretação de resultados.",
          "A IA não pode ser autora: autoria exige responder pelo trabalho e aprovar a versão final, o que a ferramenta não pode fazer.",
          "O uso deve ser declarado conforme as normas da revista ou da instituição.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d9",
    areaId: "iniciacao-cientifica",
    axisId: "vieses",
    topic: "Vieses",
    points: 1,
    stem: "Em um clube de revista, três estudos são discutidos. (I) Em um caso-controle sobre malformações congênitas, mães de bebês malformados relataram muito mais medicamentos usados na gestação do que mães de bebês saudáveis. (II) Um estudo associou o consumo de café ao câncer de pâncreas, mas os bebedores de café fumavam mais que os demais. (III) Para estimar a prevalência de hipertensão em adultos de uma cidade, os pesquisadores examinaram voluntários recrutados em academias de ginástica.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Defina viés, diferenciando-o do erro aleatório, e classifique o problema dos estudos I, II e III.",
        expected: [
          "Viés é um erro sistemático no delineamento, na condução ou na análise, que desloca o resultado em uma direção e o afasta do valor verdadeiro; não diminui com o aumento da amostra.",
          "Erro aleatório é a variação devida ao acaso; diminui com amostras maiores e se expressa no intervalo de confiança e no valor de p.",
          "I: viés de memória (recordação), um tipo de viés de informação.",
          "II: confusão: o tabagismo associa-se ao café e, independentemente, ao câncer de pâncreas, sem estar no caminho causal.",
          "III: viés de seleção: frequentadores de academia não representam a população e tendem a subestimar a prevalência.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Cite estratégias para controlar fatores de confusão no planejamento e na análise de um estudo.",
        expected: [
          "Planejamento: randomização (em ensaios), restrição (incluir apenas não fumantes) e pareamento (casos e controles com o mesmo tabagismo, sexo e idade).",
          "Análise: estratificação (analisar fumantes e não fumantes separadamente) e ajuste por modelos multivariados.",
          "A análise só controla os confusores que foram medidos; a randomização também equilibra os desconhecidos.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d10",
    areaId: "iniciacao-cientifica",
    axisId: "vieses",
    topic: "Revisão sistemática e metanálise",
    points: 1,
    figureId: "ic-f5",
    stem: "Um residente apresenta uma revisão sistemática que reuniu seis ensaios clínicos randomizados sobre um fármaco hipotético para reduzir a mortalidade em pacientes internados. Os autores buscaram em quatro bases, avaliaram o risco de viés de cada estudo e combinaram os resultados em uma metanálise (Figura 5). Um colega comenta: “quatro dos seis estudos não mostraram efeito significativo, então o remédio não funciona”.",
    items: [
      {
        label: "a",
        points: 0.6,
        prompt:
          "Identifique os elementos 1 a 4 da Figura 5, interprete o resultado combinado e responda ao comentário do colega.",
        expected: [
          "1 estimativa pontual de um estudo (o tamanho do quadrado é proporcional ao seu peso); 2 intervalo de confiança de 95% do estudo; 3 linha de nulidade (RR = 1, ausência de efeito); 4 diamante: estimativa combinada (o centro é o RR e a largura, o IC 95%).",
          "RR combinado de 0,78 (IC 95% 0,69 a 0,89): redução relativa de cerca de 22% do risco de morte; o intervalo não cruza 1, logo o resultado é estatisticamente significativo. I² = 12% indica baixa heterogeneidade.",
          "Ao colega: estudos pequenos têm pouco poder e intervalos largos que cruzam 1, mas suas estimativas apontam na mesma direção; a metanálise aumenta a precisão. Ausência de significância não é evidência de ausência de efeito.",
        ],
      },
      {
        label: "b",
        points: 0.4,
        prompt:
          "Diferencie revisão narrativa, revisão sistemática e metanálise e cite uma diretriz de relato e uma ferramenta de avaliação de qualidade de revisões.",
        expected: [
          "Narrativa: visão ampla de um tema, sem método explícito e reprodutível de busca e seleção, sujeita às escolhas do autor.",
          "Sistemática: pergunta definida (PICO), protocolo, busca abrangente, critérios explícitos de inclusão, avaliação do risco de viés e síntese reprodutível.",
          "Metanálise: técnica estatística que combina os resultados dos estudos em uma estimativa ponderada; nem toda revisão sistemática tem metanálise.",
          "Diretriz de relato: PRISMA. Avaliação da qualidade de revisões: AMSTAR 2 (para os ensaios incluídos, RoB 2; para a certeza da evidência, GRADE).",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d11",
    areaId: "iniciacao-cientifica",
    axisId: "etica-humanos",
    topic: "História da ética em pesquisa",
    points: 1,
    stem: "Entre 1932 e 1972, o Serviço de Saúde Pública dos Estados Unidos conduziu, em Tuskegee (Alabama), um estudo sobre a evolução natural da sífilis em cerca de 600 homens negros e pobres, dos quais aproximadamente 400 tinham a doença. Os participantes ouviam que eram tratados de “sangue ruim” e recebiam refeições, transporte e auxílio funeral. Mesmo depois que a penicilina se tornou o tratamento padrão, na década de 1940, não foram tratados nem informados. O estudo só terminou após denúncia na imprensa.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Identifique as violações éticas do estudo e relacione-as aos três princípios do Relatório Belmont.",
        expected: [
          "Violações: engano e ausência de consentimento informado; negação de tratamento eficaz; uso de benefícios materiais como incentivo indevido a uma população vulnerável; escolha de um grupo marginalizado para suportar os riscos.",
          "Respeito às pessoas (autonomia, consentimento e proteção dos vulneráveis), violado pelo engano.",
          "Beneficência (maximizar benefícios e minimizar danos), violada pela retenção da penicilina.",
          "Justiça (distribuição equitativa de ônus e benefícios na seleção dos participantes), violada ao concentrar os riscos em homens negros e pobres.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique a origem e a principal contribuição do Código de Nuremberg e da Declaração de Helsinque e sua relação com a Resolução CNS nº 466/2012.",
        expected: [
          "Código de Nuremberg (1947): surgiu do julgamento de médicos nazistas pelos experimentos em prisioneiros; afirma que o consentimento voluntário é absolutamente essencial, que o experimento deve evitar sofrimento desnecessário e que o participante pode interrompê-lo.",
          "Declaração de Helsinque (1964): da Associação Médica Mundial, revisada periodicamente; exige apreciação por comitê de ética independente, coloca o bem-estar do participante acima dos interesses da ciência e da sociedade e regula o uso de placebo e a pesquisa com vulneráveis.",
          "A Resolução CNS nº 466/2012 incorpora esses referenciais (autonomia, não maleficência, beneficência, justiça e equidade) e organiza no Brasil o sistema CEP/CONEP e o TCLE.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d12",
    areaId: "iniciacao-cientifica",
    axisId: "etica-humanos",
    topic: "Sistema CEP/CONEP",
    points: 1,
    figureId: "ic-f6",
    stem: "Ana, residente de clínica médica, quer estudar a adesão ao tratamento em pacientes com diabetes de um hospital universitário: vai consultar prontuários e aplicar uma entrevista. Seu colega Marcos planeja coletar amostras de sangue de uma comunidade indígena para análise genética. Os dois marcaram o início da coleta para a semana seguinte, “porque o comitê de ética é só burocracia”.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Descreva o caminho do projeto pelas etapas 1 a 6 da Figura 6 e as atribuições do CEP e da CONEP.",
        expected: [
          "1 o pesquisador elabora o projeto, o TCLE e os documentos exigidos; 2 submete-os na Plataforma Brasil; 3 o CEP institucional analisa; 4 a CONEP aprecia quando o projeto é de área temática especial; 5 é emitido parecer (aprovado, pendente ou não aprovado); 6 só com aprovação começa a coleta, seguida de relatórios parciais e final.",
          "CEP: colegiado interdisciplinar e independente, com representante dos usuários, que defende os interesses dos participantes; avalia riscos, benefícios e o TCLE e acompanha a pesquisa.",
          "CONEP: instância nacional ligada ao Conselho Nacional de Saúde; normatiza, coordena a rede de CEPs, aprecia áreas temáticas especiais e atua como instância de recurso. A Lei nº 14.874/2024 instituiu o Sistema Nacional de Ética em Pesquisa com Seres Humanos, mas a denominação CEP/CONEP segue em uso.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique por que o projeto de Marcos segue um trâmite diferente e por que nenhum dos dois pode iniciar a coleta na data marcada.",
        expected: [
          "O projeto de Marcos envolve genética humana e população indígena, áreas temáticas especiais que exigem, além do CEP, apreciação da instância nacional, com proteção adicional e respeito à organização da comunidade.",
          "Nenhum dos dois pode começar: a coleta só é permitida após parecer de aprovação.",
          "O estudo de Ana também envolve seres humanos (entrevistas e dados pessoais de prontuário).",
          "Dados coletados antes da aprovação não podem ser usados e expõem os participantes a riscos sem proteção.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d13",
    areaId: "iniciacao-cientifica",
    axisId: "etica-humanos",
    topic: "Consentimento",
    points: 1,
    stem: "Um estudante quer aplicar um questionário sobre uso de cigarro eletrônico a alunos de 14 e 15 anos de uma escola pública. Pretende obter apenas a autorização por escrito da diretora, já que “o questionário é anônimo e os alunos estão sob responsabilidade da escola”. O instrumento inclui perguntas sobre o uso de outras drogas.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Explique o que é o Termo de Consentimento Livre e Esclarecido (TCLE) e cite os seus elementos essenciais.",
        expected: [
          "O TCLE é o documento em que se registra o consentimento do participante (ou de seu responsável) dado de forma livre, após esclarecimento completo em linguagem clara. O consentimento é um processo, e não só uma assinatura.",
          "Elementos: justificativa, objetivos e procedimentos; riscos, desconfortos e como serão minimizados; benefícios; assistência; liberdade de recusar ou de retirar o consentimento a qualquer momento, sem penalização; garantia de sigilo e privacidade; ressarcimento de despesas e indenização por danos; contatos do pesquisador e do CEP.",
          "É feito em duas vias, rubricadas e assinadas, e uma fica com o participante.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Explique por que a autorização da diretora não basta, citando os documentos necessários, e indique dois cuidados éticos na aplicação do questionário.",
        expected: [
          "Menores de 18 anos não consentem sozinhos: são necessários o TCLE assinado pelos pais ou responsáveis e o Termo de Assentimento Livre e Esclarecido (TALE) do adolescente, em linguagem adequada à idade, respeitando sua recusa.",
          "A anuência da escola é necessária, mas não substitui o consentimento; o anonimato também não o dispensa. Tudo depende de aprovação prévia do CEP.",
          "Cuidados: aplicar em ambiente reservado, sem identificação e sem que professores vejam as respostas; garantir o direito de não responder; prever acolhimento e encaminhamento se surgirem situações de risco.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d14",
    areaId: "iniciacao-cientifica",
    axisId: "animais",
    topic: "Pesquisa com animais",
    points: 1,
    stem: "Um grupo quer testar uma nova pomada cicatrizante em ratos submetidos a feridas cirúrgicas na pele. O projeto prevê 80 animais “para garantir”, sem cálculo do tamanho da amostra, e não inclui analgesia após a cirurgia, “para não interferir na cicatrização”. Um membro da comissão sugere que a toxicidade da pomada seja testada antes em cultura de células da pele. O pesquisador pergunta se pode simplesmente submeter o projeto ao Comitê de Ética em Pesquisa do hospital.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt: "Explique o princípio dos 3Rs e relacione cada R a um ponto do caso.",
        expected: [
          "Os 3Rs (Russell e Burch, 1959) orientam o uso ético de animais.",
          "Substituição (replacement): usar métodos sem animais sempre que possível, como a cultura de células da pele para a triagem de toxicidade.",
          "Redução (reduction): usar o menor número de animais capaz de responder à pergunta, com cálculo amostral e delineamento adequados, e não 80 animais “para garantir”.",
          "Refinamento (refinement): minimizar dor, sofrimento e estresse, com analgesia, anestesia, manejo adequado e ponto final humanitário. Omitir analgesia sem justificativa aprovada é inaceitável.",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Cite a lei que regula o uso científico de animais no Brasil, explique o papel do CONCEA e da CEUA e responda à pergunta do pesquisador.",
        expected: [
          "Lei nº 11.794/2008 (Lei Arouca).",
          "O CONCEA (Conselho Nacional de Controle de Experimentação Animal) é o órgão normativo nacional: expede normas, credencia as instituições e estimula métodos alternativos.",
          "A CEUA (Comissão de Ética no Uso de Animais), obrigatória em cada instituição credenciada, analisa e aprova protocolos de ensino e pesquisa com animais e fiscaliza sua execução.",
          "Resposta: não. O CEP avalia pesquisas com seres humanos; o projeto com ratos deve ser aprovado pela CEUA.",
        ],
      },
    ],
  },
  {
    kind: "discursiva",
    id: "ic-d15",
    areaId: "iniciacao-cientifica",
    axisId: "integridade",
    topic: "Integridade e plataformas",
    points: 1,
    stem: "Lucas, aluno do 1º período, vai submeter um resumo a um congresso. O formulário pede o link do Currículo Lattes e o identificador ORCID de cada autor. A orientadora explica que, se o estudo envolvesse entrevistas com pacientes, o projeto teria sido registrado na Plataforma Brasil. Ao definir os autores, um colega sugere incluir o chefe do serviço, que não participou do trabalho, “para dar peso ao resumo”, e retirar a colega que fez toda a busca e a seleção dos artigos, porque “ela só pesquisou”.",
    items: [
      {
        label: "a",
        points: 0.5,
        prompt:
          "Diferencie Currículo Lattes, ORCID e Plataforma Brasil quanto à instituição responsável, à finalidade e ao que cada um identifica.",
        expected: [
          "Currículo Lattes: mantido pelo CNPq; currículo acadêmico padronizado de pesquisadores e estudantes, usado por agências e instituições em bolsas, editais e avaliações.",
          "ORCID: organização internacional sem fins lucrativos; identificador digital persistente, único e gratuito, de 16 dígitos, que distingue o pesquisador e reúne sua produção independentemente de variações de nome ou de mudança de instituição.",
          "Plataforma Brasil: sistema eletrônico nacional e unificado de registro de pesquisas envolvendo seres humanos no sistema CEP/CONEP; identifica projetos, e não pessoas, e permite submissão, pareceres e acompanhamento.",
          "(O DOI, por sua vez, identifica documentos.)",
        ],
      },
      {
        label: "b",
        points: 0.5,
        prompt:
          "Apresente os critérios de autoria, classifique as duas propostas do colega e defina as três formas clássicas de má conduta científica (FFP).",
        expected: [
          "Critérios do ICMJE, que devem ser cumpridos em conjunto: contribuição substancial para concepção, coleta, análise ou interpretação; redação ou revisão crítica; aprovação da versão final; compromisso de responder por todos os aspectos do trabalho.",
          "Incluir o chefe é autoria honorária (presenteada); ele pode, no máximo, constar nos agradecimentos se tiver contribuído de outra forma.",
          "Retirar a colega é omissão de autor (autoria fantasma): busca e seleção são a coleta de dados de uma revisão.",
          "Fabricação: inventar dados. Falsificação: manipular dados, imagens ou métodos, ou omitir resultados. Plágio: apropriar-se de ideias ou textos alheios sem dar crédito.",
        ],
      },
    ],
  },
];
