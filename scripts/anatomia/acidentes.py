"""Calcula a posição dos acidentes ósseos no modelo e desenha folhas de
conferência (vista anterior e lateral de cada osso, com os pontos).

Cada acidente é uma regra: na faixa de altura [lo, hi] do osso (0 = ponto
mais baixo, 1 = mais alto), o vértice que vai mais longe na direção
(lateral, cima, frente). Lado esquerdo do corpo = +X, frente = +Z.
`mid` restringe a vértices perto da linha média do osso (|x - centro| pequeno).
`half` restringe a metade lateral (+1) ou medial (-1) do osso.

Uso (numpy instalado):
  python scripts/anatomia/acidentes.py public/anatomia/ecorche.meshopt.glb src/lib/data/anatomia/acidentes.json <pasta_das_folhas>
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
from glbgeom import load  # noqa: E402  (mesma pasta)

# estrutura, peça, [(id, nome, explicação, faixa, direção, opções)]
L = {}


def lm(structure, part, items):
    L[(structure, part)] = items


lm("umero", "humerus", [
    ("cabeca-umero", "Cabeça do úmero", "Articula-se com a cavidade glenoidal da escápula.", (0.9, 1), (-1, 0.6, -0.2), {}),
    ("tuberculo-maior", "Tubérculo maior", "Recebe supraespinal, infraespinal e redondo menor.", (0.88, 1), (1, 0.3, 0), {}),
    ("tuberculo-menor", "Tubérculo menor", "Recebe o subescapular.", (0.86, 0.96), (0, 0, 1), {}),
    ("tuberosidade-deltoide", "Tuberosidade para o deltoide", "Onde se insere o deltoide, no meio da face lateral.", (0.5, 0.68), (1, 0, 0.2), {}),
    ("epicondilo-medial", "Epicôndilo medial", "Origem dos flexores do antebraço; atrás dele passa o nervo ulnar.", (0, 0.16), (-1, 0, 0), {}),
    ("epicondilo-lateral", "Epicôndilo lateral", "Origem dos extensores do antebraço (epicondilite = cotovelo de tenista).", (0, 0.16), (1, 0, 0), {}),
    ("capitulo", "Capítulo", "Face arredondada lateral que articula com a cabeça do rádio.", (0, 0.07), (0.5, -1, 0.5), {}),
    ("troclea", "Tróclea", "Carretel medial que articula com a ulna.", (0, 0.07), (-0.4, -1, 0), {}),
])
lm("radio", "radius", [
    ("cabeca-radio", "Cabeça do rádio", "Gira no ligamento anular na pronação e supinação.", (0.94, 1), (0, 1, 0), {}),
    ("tuberosidade-radio", "Tuberosidade do rádio", "Inserção do bíceps braquial.", (0.78, 0.9), (-1, 0, 0.3), {}),
    ("estiloide-radio", "Processo estiloide do rádio", "Ponta lateral do punho; inserção do braquiorradial.", (0, 0.1), (1, -1, 0), {}),
])
lm("ulna", "ulna", [
    ("olecrano", "Olécrano", "A ponta do cotovelo; recebe o tríceps.", (0.9, 1), (0, 1, -1), {}),
    ("coronoide-ulna", "Processo coronoide", "Recebe o braquial; prende a tróclea pela frente.", (0.82, 0.95), (0, 0, 1), {}),
    ("estiloide-ulna", "Processo estiloide da ulna", "Ponta medial do punho, mais alta que a do rádio.", (0, 0.08), (0, -1, -0.4), {}),
])
lm("escapula", "scapula", [
    ("acromio", "Acrômio", "A ponta do ombro; articula-se com a clavícula.", (0.75, 1), (1, 0.7, 0), {}),
    ("coracoide", "Processo coracoide", "Bico anterior: peitoral menor, coracobraquial e cabeça curta do bíceps.", (0.6, 1), (0, 0, 1), {}),
    ("cavidade-glenoidal", "Cavidade glenoidal", "Recebe a cabeça do úmero.", (0.6, 0.84), (1, 0, 0.3), {"half": 1}),
    ("angulo-inferior", "Ângulo inferior", "Na altura da 7ª costela: referência na palpação das costas.", (0, 0.15), (0, -1, 0), {}),
    ("angulo-superior", "Ângulo superior", "Inserção do levantador da escápula.", (0.75, 1), (-1, 0.8, 0), {}),
    ("espinha-escapula", "Espinha da escápula", "Separa as fossas supra e infraespinal; origem do deltoide e inserção do trapézio.", (0.6, 0.85), (0, 0.2, -1), {}),
])
lm("clavicula", "clavicle", [
    ("extremidade-esternal", "Extremidade esternal", "Articula-se com o manúbrio.", (0, 1), (-1, 0, 0), {}),
    ("extremidade-acromial", "Extremidade acromial", "Articula-se com o acrômio.", (0, 1), (1, 0, 0), {}),
])
lm("esterno", "manubrium", [
    ("incisura-jugular", "Incisura jugular", "O 'V' palpável na base do pescoço, acima do manúbrio.", (0.85, 1), (0, 1, 0.3), {"mid": 0.006}),
])
lm("esterno", "body of sternum", [
    ("angulo-esterno", "Ângulo do esterno", "Junção manúbrio–corpo, no nível da 2ª cartilagem costal.", (0.9, 1), (0, 0.3, 1), {"mid": 0.006}),
])
lm("esterno", "xiphoid process", [
    ("processo-xifoide", "Processo xifoide", "Ponta inferior do esterno.", (0, 0.3), (0, -1, 0), {}),
])
lm("femur", "femur", [
    ("cabeca-femur", "Cabeça do fêmur", "Encaixa no acetábulo.", (0.86, 1), (-1, 0.5, 0), {}),
    ("trocanter-maior", "Trocânter maior", "Recebe glúteos médio e mínimo; palpável na lateral do quadril.", (0.86, 1), (1, 0.4, 0), {}),
    ("trocanter-menor", "Trocânter menor", "Recebe o iliopsoas.", (0.76, 0.88), (-0.6, 0, -0.8), {}),
    ("condilo-medial", "Côndilo medial", "Articula-se com a tíbia.", (0, 0.08), (-1, -0.6, 0), {}),
    ("condilo-lateral", "Côndilo lateral", "Articula-se com a tíbia.", (0, 0.08), (1, -0.6, 0), {}),
    ("epicondilo-medial-femur", "Epicôndilo medial", "Fixa o ligamento colateral medial do joelho.", (0.03, 0.12), (-1, 0, 0), {}),
    ("epicondilo-lateral-femur", "Epicôndilo lateral", "Fixa o ligamento colateral lateral do joelho.", (0.03, 0.12), (1, 0, 0), {}),
    ("tuberculo-adutor", "Tubérculo do adutor", "Inserção do adutor magno, acima do epicôndilo medial.", (0.09, 0.16), (-1, 0.6, 0), {}),
])
lm("patela", "patella", [
    ("base-patela", "Base da patela", "Borda superior; recebe o tendão do quadríceps.", (0.8, 1), (0, 1, 0), {}),
    ("apice-patela", "Ápice da patela", "Ponta inferior; daqui parte o ligamento da patela.", (0, 0.2), (0, -1, 0), {}),
])
lm("tibia", "tibia", [
    ("tuberosidade-tibia", "Tuberosidade da tíbia", "Recebe o ligamento da patela.", (0.8, 0.92), (0, 0, 1), {}),
    ("condilo-medial-tibia", "Côndilo medial", "Platô tibial medial.", (0.92, 1), (-1, 0, 0), {}),
    ("condilo-lateral-tibia", "Côndilo lateral", "Platô tibial lateral; articula-se com a fíbula por baixo.", (0.92, 1), (1, 0, 0), {}),
    ("eminencia-intercondilar", "Eminência intercondilar", "Entre os platôs; fixa os ligamentos cruzados e os meniscos.", (0.95, 1), (0, 1, 0), {"mid": 0.01}),
    ("maleolo-medial", "Maléolo medial", "O 'osso' de dentro do tornozelo.", (0, 0.1), (-1, -1, 0), {}),
])
lm("fibula", "fibula", [
    ("cabeca-fibula", "Cabeça da fíbula", "Recebe o bíceps femoral; o nervo fibular comum contorna o colo logo abaixo.", (0.93, 1), (0, 1, 0), {}),
    ("maleolo-lateral", "Maléolo lateral", "O 'osso' de fora do tornozelo, mais baixo que o medial.", (0, 0.1), (0, -1, 0), {}),
])
lm("calcaneo", "calcaneus", [
    ("tuber-calcaneo", "Túber do calcâneo", "Recebe o tendão do calcâneo.", (0, 1), (0, 0, -1), {}),
    ("sustentaculo-talus", "Sustentáculo do tálus", "Prateleira medial que apoia o tálus; sob ela corre o flexor longo do hálux.", (0.4, 1), (-1, 0.3, 0), {}),
])
lm("osso-do-quadril", "hip bone", [
    ("crista-iliaca", "Crista ilíaca", "Borda superior do ílio; a linha entre as duas cristas passa em L4.", (0.9, 1), (0, 1, 0), {}),
    ("eias", "Espinha ilíaca anterossuperior", "Ponto mais anterior da crista; fixa o ligamento inguinal e o sartório.", (0.6, 1), (0.2, 0.3, 1), {}),
    ("eips", "Espinha ilíaca posterossuperior", "As 'covinhas' da lombar, no nível de S2.", (0.6, 1), (-0.2, 0.2, -1), {}),
    ("tuber-isquiatico", "Túber isquiático", "Onde se senta; origem dos isquiotibiais.", (0, 0.25), (0, -1, -0.6), {}),
    ("espinha-isquiatica", "Espinha isquiática", "Referência para o bloqueio do nervo pudendo.", (0.2, 0.45), (-1, 0, -0.7), {}),
    ("tuberculo-pubico", "Tubérculo púbico", "Fixa a outra ponta do ligamento inguinal.", (0.1, 0.45), (-0.3, 0.2, 1), {}),
    ("acetabulo", "Acetábulo", "Cavidade onde encaixa a cabeça do fêmur.", (0.3, 0.5), (1, 0, 0.3), {"half": 1}),
])
lm("mandibula", "mandible", [
    ("condilo-mandibula", "Processo condilar", "Articula-se com o temporal (ATM).", (0.75, 1), (0.3, 1, -1), {"half": 1}),
    ("coronoide-mandibula", "Processo coronoide", "Recebe o temporal.", (0.75, 1), (0.2, 1, 0.8), {"half": 1}),
    ("angulo-mandibula", "Ângulo da mandíbula", "Recebe masseter (por fora) e pterigóideo medial (por dentro).", (0, 0.5), (0.4, -1, -1), {"half": 1}),
    ("protuberancia-mentual", "Protuberância mentual", "O queixo.", (0, 0.5), (0, -0.4, 1), {"mid": 0.008}),
])
lm("temporal-osso", "temporal bone", [
    ("processo-mastoide", "Processo mastoide", "Palpável atrás da orelha; recebe o ECM.", (0, 0.5), (0.6, -1, -1), {}),
    ("processo-estiloide", "Processo estiloide", "Ponta fina para baixo e para frente: estilo-hióideo e ligamentos.", (0, 0.4), (-0.3, -1, 0.5), {}),
    ("processo-zigomatico", "Processo zigomático", "Forma o arco zigomático com o zigomático.", (0, 1), (0.3, 0, 1), {}),
])
lm("occipital", "occipital bone", [
    ("protuberancia-occipital", "Protuberância occipital externa", "O ínio, palpável na nuca; fixa o ligamento nucal.", (0.2, 0.8), (0, 0, -1), {"mid": 0.008}),
    ("condilo-occipital", "Côndilo occipital", "Apoia o crânio no atlas (o 'sim').", (0, 0.25), (0.2, -1, 0.4), {"half": 1}),
])
lm("frontal", "frontal bone", [
    ("glabela", "Glabela", "Ponto liso entre as sobrancelhas.", (0, 0.45), (0, 0, 1), {"mid": 0.008}),
])
lm("atlas", "atlas", [
    ("tuberculo-anterior-atlas", "Tubérculo anterior", "Na frente do arco anterior; atrás dele, a fóvea do dente.", (0, 1), (0, 0, 1), {"mid": 0.006}),
    ("processo-transverso-atlas", "Processo transverso do atlas", "O mais largo das cervicais; palpável entre mastoide e ângulo da mandíbula.", (0, 1), (1, 0, 0), {}),
])
lm("axis", "axis", [
    ("dente-axis", "Dente do áxis", "Pivô em torno do qual o atlas gira.", (0, 1), (0, 1, 0.3), {"mid": 0.006}),
    ("espinhoso-axis", "Processo espinhoso do áxis", "Bífido e grande: o primeiro palpável abaixo do occipital.", (0, 1), (0, 0, -1), {}),
])
lm("vertebra-proeminente", "seventh cervical vertebra", [
    ("espinhoso-c7", "Processo espinhoso de C7", "A saliência na base da nuca.", (0, 1), (0, -0.3, -1), {}),
])
lm("sacro", "sacrum", [
    ("promontorio", "Promontório", "Borda anterior de S1; referência obstétrica.", (0.75, 1), (0, 0.3, 1), {"mid": 0.01}),
    ("apice-sacro", "Ápice do sacro", "Articula-se com o cóccix.", (0, 0.15), (0, -1, 0), {}),
])

def more(structure, part, items):
    """Acrescenta acidentes a um osso que já tem lista (ou cria a lista)."""
    L.setdefault((structure, part), []).extend(items)


# ---------------------------------------------------------------- segunda leva
more("umero", "humerus", [
    ("colo-cirurgico", "Colo cirúrgico", "Onde o úmero mais se fratura; o nervo axilar contorna aqui.", (0.8, 0.84), (1, 0, 0.3), {}),
])
more("radio", "radius", [
    ("tuberculo-dorsal", "Tubérculo dorsal (de Lister)", "Polia do tendão do extensor longo do polegar.", (0.02, 0.1), (0, 0, -1), {}),
])
more("escapula", "scapula", [
    ("margem-medial", "Margem medial", "Recebe os romboides e o serrátil anterior; descola na escápula alada.", (0.35, 0.65), (-1, 0, 0), {}),
    ("margem-lateral", "Margem lateral", "Origem do redondo menor e do redondo maior.", (0.25, 0.5), (1, 0, 0), {}),
    ("fossa-infraespinal", "Fossa infraespinal", "Face posterior, abaixo da espinha: origem do infraespinal.", (0.3, 0.5), (0, 0, -1), {}),
])
more("clavicula", "clavicle", [
    ("tuberculo-conoide", "Tubérculo conoide", "Fixa o ligamento coracoclavicular (parte conoide).", (0, 1), (0.6, -1, -0.5), {}),
])
more("femur", "femur", [
    ("tuberosidade-glutea", "Tuberosidade glútea", "Inserção do glúteo máximo.", (0.72, 0.8), (0.5, 0, -1), {}),
    ("linha-aspera", "Linha áspera", "Crista posterior da diáfise: adutores e vastos.", (0.4, 0.6), (0, 0, -1), {}),
    ("face-patelar", "Face patelar", "Onde a patela desliza.", (0.03, 0.1), (0, 0, 1), {}),
])
more("tibia", "tibia", [
    ("margem-anterior-tibia", "Margem anterior", "A canela: subcutânea, sente-se com o dedo.", (0.4, 0.6), (0, 0, 1), {}),
])
more("fibula", "fibula", [
    ("colo-fibula", "Colo da fíbula", "O nervo fibular comum contorna aqui: pé caído na lesão.", (0.86, 0.91), (1, 0, 0), {}),
])
more("calcaneo", "calcaneus", [
    ("troclea-fibular", "Tróclea fibular", "Separa os tendões dos fibulares longo e curto.", (0.2, 0.7), (1, 0, 0), {}),
])
more("osso-do-quadril", "hip bone", [
    ("eiai", "Espinha ilíaca anteroinferior", "Origem do reto femoral.", (0.45, 0.6), (0, 0, 1), {"half": 1}),
    ("tuberculo-iliaco", "Tubérculo ilíaco", "O ponto mais largo da crista ilíaca.", (0.82, 0.95), (1, 0.2, 0.2), {}),
])
more("sacro", "sacrum", [
    ("crista-sacral-mediana", "Crista sacral mediana", "Processos espinhosos fundidos, na linha média de trás.", (0.4, 0.7), (0, 0, -1), {"mid": 0.01}),
    ("asa-sacro", "Asa do sacro", "Parte lateral da base; apoia o ílio na sacroilíaca.", (0.75, 1), (1, 0.3, 0), {}),
])
# crânio
more("frontal", "frontal bone", [
    ("arco-superciliar", "Arco superciliar", "Saliência acima da órbita, sob a sobrancelha.", (0.2, 0.45), (0.5, 0, 1), {"half": 1}),
    ("processo-zigomatico-frontal", "Processo zigomático do frontal", "Desce para encontrar o zigomático na lateral da órbita.", (0, 0.4), (1, -0.3, 0), {"half": 1}),
    ("tuber-frontal", "Túber frontal", "A bossa da testa.", (0.5, 0.8), (0.4, 0.2, 1), {"half": 1}),
])
more("parietal", "parietal bone", [
    ("tuber-parietal", "Túber parietal", "O ponto mais saliente da lateral da calvária.", (0, 1), (1, 0.2, 0), {}),
])
more("maxila", "maxilla", [
    ("processo-alveolar", "Processo alveolar", "Onde ficam os dentes de cima.", (0, 0.2), (0, -1, 0.3), {}),
    ("processo-frontal-maxila", "Processo frontal da maxila", "Sobe ao lado do nariz até o frontal.", (0.8, 1), (0, 1, 0), {}),
    ("processo-zigomatico-maxila", "Processo zigomático da maxila", "Encontra o zigomático na maçã do rosto.", (0.3, 0.8), (1, 0, 0), {}),
])
more("zigomatico-osso", "zygomatic bone", [
    ("processo-temporal-zigomatico", "Processo temporal do zigomático", "Vai para trás e forma o arco zigomático.", (0, 1), (0, 0, -1), {}),
    ("processo-frontal-zigomatico", "Processo frontal do zigomático", "Sobe pela lateral da órbita.", (0, 1), (0, 1, 0), {}),
])
more("esfenoide", "sphenoid bone", [
    ("processo-pterigoide", "Processo pterigoide", "Desce atrás da maxila: origem dos pterigóideos.", (0, 0.4), (0.3, -1, 0), {"half": 1}),
    ("asa-maior", "Asa maior", "Parte lateral: fossa temporal e parede da órbita; tem os forames redondo, oval e espinhoso.", (0.2, 0.9), (1, 0, 0), {}),
])
more("etmoide", "ethmoid", [
    ("crista-galli", "Crista etmoidal (crista galli)", "Crista que sobe na fossa anterior; prende a foice do cérebro.", (0.7, 1), (0, 1, 0), {"mid": 0.004}),
    ("lamina-perpendicular", "Lâmina perpendicular", "Desce e forma a parte de cima do septo nasal.", (0, 0.3), (0, -1, 0), {"mid": 0.004}),
])
# coluna e tórax
more("vertebras-cervicais", "fifth cervical vertebra", [
    ("espinhoso-cervical", "Processo espinhoso bífido (C5)", "Curto e bífido: a marca das cervicais típicas.", (0, 1), (0, -0.2, -1), {}),
    ("transverso-cervical", "Processo transverso (C5)", "Tem o forame transversário, por onde sobe a artéria vertebral.", (0, 1), (1, 0, 0.3), {}),
    ("corpo-cervical", "Corpo vertebral (C5)", "Pequeno e largo, com os uncos nos lados de cima.", (0, 1), (0, 0, 1), {"mid": 0.006}),
])
more("vertebras-toracicas", "sixth thoracic vertebra", [
    ("espinhoso-toracico", "Processo espinhoso (T6)", "Longo e inclinado para baixo, como uma telha.", (0, 1), (0, -0.6, -1), {}),
    ("transverso-toracico", "Processo transverso (T6)", "Tem a fóvea para o tubérculo da costela.", (0, 1), (1, 0, -0.4), {}),
    ("corpo-toracico", "Corpo vertebral (T6)", "Em forma de coração, com fóveas para a cabeça das costelas.", (0, 1), (0, 0, 1), {"mid": 0.006}),
])
more("vertebras-lombares", "third lumbar vertebra", [
    ("espinhoso-lombar", "Processo espinhoso (L3)", "Curto, largo e quadrado, quase horizontal.", (0, 1), (0, 0, -1), {}),
    ("transverso-lombar", "Processo transverso (L3)", "Longo e fino; dá origem ao psoas e ao quadrado do lombo.", (0, 1), (1, 0, 0), {}),
    ("corpo-lombar", "Corpo vertebral (L3)", "Grande, em forma de rim: carrega o peso do tronco.", (0, 1), (0, 0, 1), {"mid": 0.008}),
])
more("costelas-verdadeiras", "sixth rib", [
    ("cabeca-costela", "Cabeça da costela (6ª)", "Articula-se com os corpos de duas vértebras.", (0, 1), (-1, 0, -0.6), {}),
    ("angulo-costela", "Ângulo da costela (6ª)", "Onde a costela vira para a frente; o ponto mais posterior.", (0, 1), (0.3, 0, -1), {}),
    ("extremidade-anterior-costela", "Extremidade anterior (6ª)", "Continua na cartilagem costal.", (0, 1), (0, 0, 1), {}),
])
# mão
more("escafoide", "scaphoid", [
    ("tuberculo-escafoide", "Tubérculo do escafoide", "Palpável na base da eminência tenar; fixa o retináculo dos flexores.", (0, 1), (0.4, -0.3, 1), {}),
])
more("hamato", "hamate", [
    ("hamulo-hamato", "Hâmulo do hamato", "Gancho na palma: limita o túnel do carpo e o canal de Guyon.", (0, 1), (0, 0, 1), {}),
])
more("trapezio-osso", "trapezium", [
    ("tuberculo-trapezio", "Tubérculo do trapézio", "Fixa o retináculo dos flexores; ao lado, o sulco do flexor radial do carpo.", (0, 1), (0, 0, 1), {}),
])
more("metacarpais", "first metacarpal bone", [
    ("base-1-metacarpal", "Base do 1º metacarpal", "Articulação em sela com o trapézio; fratura de Bennett.", (0.75, 1), (0, 1, 0), {}),
])
more("metacarpais", "fifth metacarpal bone", [
    ("colo-5-metacarpal", "Colo do 5º metacarpal", "Fratura do boxeador.", (0.05, 0.25), (-0.5, 0, -1), {}),
])
more("falanges-da-mao", "distal phalanx of middle finger", [
    ("tuberosidade-falange-distal", "Tuberosidade da falange distal", "A ponta do dedo, sob a polpa.", (0, 0.3), (0, -1, 0), {}),
])
# pé
more("talus", "talus", [
    ("troclea-talus", "Tróclea do tálus", "Encaixa entre os maléolos: a articulação do tornozelo.", (0.7, 1), (0, 1, 0), {}),
    ("cabeca-talus", "Cabeça do tálus", "Articula-se com o navicular.", (0, 1), (0, 0, 1), {}),
])
more("navicular", "navicular bone of foot", [
    ("tuberosidade-navicular", "Tuberosidade do navicular", "Inserção do tibial posterior; palpável na borda medial do pé.", (0, 1), (-1, -0.3, 0), {}),
])
more("metatarsais", "fifth metatarsal bone", [
    ("tuberosidade-5-metatarsal", "Tuberosidade do 5º metatarsal", "Inserção do fibular curto; arranca na entorse em inversão.", (0, 1), (1, 0, -0.6), {}),
])
more("metatarsais", "first metatarsal bone", [
    ("cabeca-1-metatarsal", "Cabeça do 1º metatarsal", "Apoio da frente do pé; o joanete se forma aqui.", (0, 1), (0, -0.3, 1), {}),
])


ORDER = ["umero", "radio", "ulna", "escapula", "clavicula", "esterno", "femur", "patela", "tibia",
         "fibula", "calcaneo", "osso-do-quadril", "mandibula", "temporal-osso", "occipital",
         "frontal", "atlas", "axis", "vertebra-proeminente", "sacro"]


def pick(pos, band, direction, opts):
    y = pos[:, 1]
    lo, hi = y.min(), y.max()
    h = hi - lo
    sel = (y >= lo + band[0] * h - 1e-9) & (y <= lo + band[1] * h + 1e-9)
    cx = (pos[:, 0].min() + pos[:, 0].max()) / 2
    if "mid" in opts:
        sel &= np.abs(pos[:, 0] - cx) <= opts["mid"] + 1e-9
        if not sel.any():
            raise SystemExit("faixa vazia")
    if "half" in opts:
        sel &= (pos[:, 0] - cx) * opts["half"] >= 0
    cand = pos[sel]
    d = np.array(direction, dtype=float)
    d /= np.linalg.norm(d)
    i = int(np.argmax(cand @ d))
    p = cand[i]
    # "normal" aproximada: do centro da vizinhança para o ponto (para saber quando está de costas).
    near = pos[np.linalg.norm(pos - p, axis=1) < 0.03]
    n = p - near.mean(0)
    n = n / (np.linalg.norm(n) or 1)
    return p, n


def main(glb, out_json, img_dir):
    meshes = load(glb, {"skeleton"})
    by = {}
    for m in meshes:
        by.setdefault(m["key"], []).append(m)
    result = {}
    os.makedirs(img_dir, exist_ok=True)
    sheets = {}
    for (structure, part), items in L.items():
        cands = by[part]
        # Lado esquerdo (+X) se houver os dois; senão a peça da linha média.
        mesh = next((m for m in cands if m["side"] == "left"), cands[0])
        bilateral = any(m["side"] == "right" for m in cands)
        for (lid, name, info, band, direction, opts) in items:
            p, n = pick(mesh["pos"], band, direction, opts)
            result.setdefault(structure, []).append({
                "id": lid, "name": name, "info": info, "part": part,
                "pos": [round(float(v), 4) for v in p],
                "normal": [round(float(v), 3) for v in n],
                "mirror": bilateral,
            })
            sheets.setdefault(structure, []).append((mesh["pos"], p, name))
    with open(out_json, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(result, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print(sum(len(v) for v in result.values()), "acidentes em", len(result), "ossos")

    # Folhas: vista anterior (x, y) e lateral esquerda (z, y).
    for structure, entries in sheets.items():
        pts = np.vstack({id(e[0]): e[0] for e in entries}.values() and [e[0] for e in entries])
        lo = pts.min(0)
        hi = pts.max(0)
        size = 520
        img = Image.new("RGB", (size * 2 + 20, size + 40), "white")
        dr = ImageDraw.Draw(img)
        span = max(hi - lo) * 1.08
        def proj(v, view):
            a = (v[0] - lo[0]) if view == 0 else (hi[2] - v[2])
            b = hi[1] - v[1]
            # anterior: esquerda do corpo (+X) aparece à direita da imagem
            return (10 + view * (size + 20) + a / span * size, 30 + b / span * size)
        for view in (0, 1):
            for v in pts[:: max(1, len(pts) // 6000)]:
                x, y = proj(v, view)
                dr.point((x, y), fill=(150, 150, 150))
            dr.text((10 + view * (size + 20), 8), ("ANTERIOR (direita da imagem = lateral)" if view == 0 else "LATERAL (esquerda da imagem = frente)"), fill="black")
        for k, (_, p, name) in enumerate(entries):
            for view in (0, 1):
                x, y = proj(p, view)
                dr.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(230, 40, 30))
                dr.text((x + 7, y - 6), str(k + 1), fill=(200, 0, 0))
        legend = "  ".join(f"{k + 1}.{e[2]}" for k, e in enumerate(entries))
        dr.text((10, size + 22), legend[:180], fill="black")
        img.save(os.path.join(img_dir, f"{structure}.png"))


if __name__ == "__main__":
    main(*sys.argv[1:4])
