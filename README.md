# Atlas — Biblioteca Médica

Biblioteca de referência da turma de Medicina do 1º período do UNIEURO, semestre 2026.2.
Reúne, em um só catálogo, a bibliografia das sete unidades curriculares — transcrita
diretamente dos planos de ensino oficiais, com proveniência rastreável por seção e página.

## Regra central

**Um livro, muitas disciplinas.** Cada título existe uma única vez em `src/lib/data/books.ts`
e se relaciona com as disciplinas por `src/lib/data/book-disciplines.ts`, que registra o tipo
de bibliografia (básica, básica virtual, complementar, outras referências) em cada uma.
Quatro títulos aparecem em dois planos e têm um só registro.

## Acesso fechado e PDFs da turma

O Atlas é **fechado para a turma**: uma senha compartilhada (`ATLAS_SENHA_TURMA`) protege todas
as páginas, os planos de ensino e os PDFs. Enquanto a variável estiver vazia o site fica aberto
e mostra um aviso no topo.

```bash
cp .env.example .env.local   # preencha ATLAS_SENHA_TURMA e ATLAS_COOKIE_SECRET
```

PDFs dos livros ficam em `storage/livros/` (fora de `public/`, nunca versionados) e são servidos
só por `/api/arquivos/<id>`, atrás da senha. Cada arquivo registra **origem** e **autorização**
no registro do livro — veja `storage/livros/README.md` para publicar um.

- Livro com PDF → `class_only`: "Ler PDF" e "Baixar".
- Livro sem PDF → `reference_only`: _"Referência catalogada — arquivo ainda não disponibilizado"_.
- Documento aberto (ex.: Código de Ética Médica no site do CFM) → `public`, link para a fonte.
- Para tirar um livro do catálogo sem perder a proveniência: `visibility: "oculto"`.

Regras completas em `/uso-responsavel`.

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS 4 · Lucide · Zod · Vitest ·
Testing Library · Playwright · ESLint · Prettier.

Sem banco de dados na v1: os dados vivem em módulos TypeScript versionados, acessados apenas
por `src/lib/repository`. Migrar para Supabase significa reimplementar essa interface —
nenhuma página precisa mudar.

## Scripts

```bash
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção (77 páginas estáticas)
npm start            # serve o build
npm test             # testes unitários e de componentes (Vitest)
npm run e2e          # end-to-end (npx playwright install chromium); com ATLAS_SENHA_TURMA definida testa também o login
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run format       # Prettier
npm run extract:planos  # re-extrai o texto dos PDFs em Downloads (pdfjs-dist)
```

## Estrutura

```
src/
  app/                    rotas (home, livros, disciplinas, planos-de-ensino, busca, uso-responsavel)
  components/
    app-shell/            Header, MobileNav, Footer, ThemeToggle
    book/                 BookCover, BookCard, BookGrid, badges, FavoriteButton, motifs das capas
    catalog/              CatalogBrowser, FilterPanel, FilterChips
    discipline/           DisciplineCard
    search/               GlobalSearch
    ui/                   Breadcrumbs, EmptyState, StatsCard, skeletons, AccessNotice
  lib/
    data/                 seeds: books, disciplines, book-disciplines, teaching-plans
    domain/               types, normalize, search, dedupe
    auth.ts               senha da turma, cookie HMAC
    repository/           a fronteira de dados
tests/                    Vitest
e2e/                      Playwright
docs/extracao-planos/     texto extraído de cada PDF, para auditoria
public/planos/            os 7 planos de ensino (também atrás da senha)
storage/livros/           PDFs postados pela turma (não versionados)
tools/                    extrator de texto dos PDFs
```

## Dados e revisão

Os registros carregam `provenance` com plano de origem, seção, página e citação literal.
Nove estão marcados `reviewStatus: "pendente"` por erros presentes nos próprios planos
(citações automáticas quebradas, grafia, links ausentes ou corrompidos). Eles aparecem com o
selo **Revisar** no catálogo e a nota explicativa na página do livro — nada foi corrigido em
silêncio.

Capas: todas são placeholders editoriais gerados (`coverSource: "placeholder"`), com uma
linguagem visual por área. A página do livro deixa isso explícito.

## Navegação

Cinco destinos, iguais no topo e na barra do celular (`src/lib/navigation.ts`):
**Início** (o painel do dia), **Estudar** (simulados, modo rápido, simulado de
imagem, flashcards, anatomia 3D, fila de erros e desempenho), **Matérias**, **Biblioteca**
(livros e resumos) e **Agenda** (datas e notas). Os endereços antigos valem
todos.

## Estudar

Tudo o que é do aluno — tentativas, progresso dos cartões, diário de estudo,
fila de erros — fica **no aparelho** (localStorage), porque não há conta
individual. A exceção são os baralhos publicados para a turma.

- **Simulados** (`/simulados/<slug>`): a prova inteira, corrigida no fim, com
  autoavaliação das discursivas e mapa por eixo.
- **Modo rápido** (`/estudar/rapido`): uma objetiva por vez, corrigida na hora,
  por área ou por eixo. Teclas 1–4 e Enter.
- **Simulado de imagem** (`/estudar/imagem`): uma figura sem legenda e um
  relógio por figura, como na TV da prova prática; a pessoa revela e marca se
  acertou.
- **Fila de erros** (`/estudar/erros`): toda objetiva errada (no modo rápido ou
  num simulado corrigido) entra, e só sai com dois acertos seguidos.
- **Desempenho** (`/progresso`): respostas de todos os modos — acerto por área
  e por modo, assuntos mais fracos, últimos 14 dias, sessões recentes — e, logo
  abaixo, a evolução prova a prova dos simulados completos.

### Flashcards (`/flashcards`)

Revisão espaçada em caixas de Leitner (`src/lib/domain/flashcard-review.ts`):
**Errei** volta para a primeira caixa e reaparece na mesma sessão daqui a 4
cartões; **Quase** fica na caixa e volta amanhã; **Sei** sobe e demora mais
(1, 3, 7, 16, 35 dias). Espaço vira, 1-2-3 dão a nota.

Quatro origens:

- **Oficiais** — `src/lib/data/flashcards/*.json`, importados dos roteiros
  interativos de membros superiores (Moore, cap. 6, com image occlusion),
  semiologia de cabeça e pescoço (fotos de crânio e fácies, linfonodos),
  lesões elementares de pele (fotos) e vírus (Tortora, cap. 13, com as
  figuras do livro no verso). As
  figuras ficam em `storage/flashcards/` (fora do Git, como as dos simulados) e
  são servidas por `/api/flashcards/figuras/<arquivo>`, atrás da senha.
- **Do banco** — gerados na hora a partir do banco de questões: cada objetiva
  vira um cartão, cada item discursivo outro. Corrigir a questão corrige o cartão.
- **Meus** — escritos pelo aluno, guardados no navegador. Exportam e importam
  em `.atlas.json`, e importam também texto com TAB do Anki e do Quizlet.
- **Da turma** — um baralho próprio publicado. Mora em
  `storage/flashcards-turma.json` (local) ou `flashcards/turma.json` (bucket),
  separado do manifesto do catálogo. Quem publica recebe um segredo, guardado
  no aparelho; só com ele se atualiza ou retira (o servidor guarda só o hash).
  O admin oculta ou exclui em `/admin`. Só texto: imagem de aluno exigiria
  upload aberto a qualquer um com a senha da turma.

### Atlas de anatomia (`/anatomia`)

Organizado como um atlas: primeiro achar, depois estudar.

- **Início** (`/anatomia`): busca (português, inglês ou latim), os dois
  sistemas (esquelético e muscular), as oito regiões do corpo e, embaixo,
  Lições, Revisar e Desafiar.
- **Região** (`/anatomia/regiao/<id>`): o sumário da região — as lições dela,
  os ossos, os acidentes (cada um abre o atlas com o ponto aceso:
  `?estrutura=femur&acidente=trocanter-maior`), músculos superficiais,
  profundos e outras estruturas —, com "Ver em 3D".
- **Atlas 3D** (`/anatomia/atlas`): índice em árvore (Ossos/Músculos → região
  → estrutura, uma região aberta por vez) e o corpo em 3D. Entradas:
  `?estrutura=femur`, `?sistema=ossos` (músculos desligados), `?regiao=coxa`
  (câmera na região). Passar o mouse acende e nomeia; escolher prende uma
  etiqueta e leva a câmera até a estrutura; dá para destacar (o resto apagado),
  esmaecer, ver em raio-X, isolar ou ocultar. **Nos ossos, os acidentes aparecem como pontos
  numerados no modelo**, ligados à lista da ficha. No celular, o índice abre
  por cima e a ficha sobe numa gaveta com os acidentes numa fileira.
- **Lições** (`/anatomia/licoes`, `/anatomia/licao/<região>-<etapa>-<n>`):
  organizadas como um curso — cada região é um módulo, e as etapas seguem a
  ordem de um atlas: **ossos → acidentes ósseos → músculos superficiais →
  músculos profundos**, em lições de até 7 itens divididas por igual (59
  lições: 142 músculos, 52 ossos, 120 acidentes). A estrutura acende e a
  pessoa escreve o nome, corrigido letra por letra (acento e maiúscula não
  contam). Três rodadas — com o nome à vista, só com a primeira letra, de
  memória olhando o outro lado. Nos acidentes, a própria região acende na
  superfície do osso — uma mancha vermelha com contorno, que pulsa de leve,
  sobre o osso na cor natural (verde no acerto) —, a câmera chega perto,
  olhando a superfície de frente, e o nome só aparece depois da resposta. É
  só um shader no material: a geometria do modelo não muda.
  Um filtro no topo mostra uma etapa só no corpo inteiro; o módulo da próxima
  lição abre sozinho. Dois jeitos de ver, que o aluno alterna a qualquer momento (e que
  valem também no Desafiar): **Corpo** — o corpo inteiro, os outros músculos
  apagados e o alvo aceso; se o alvo é profundo ou é um osso, só o que está na
  frente dele vira véu translúcido — e **Raio-X** — só o alvo sólido, o resto
  em vulto. Começa em Corpo; a escolha fica guardada no aparelho.
- **Revisar** (`/anatomia/revisar`): o que acertou de memória volta em 1, 3,
  7, 14 e 30 dias; o que errou volta no mesmo dia.
- **Desafiar** (`/anatomia/quiz`): identificar, localizar tocando e
  reconhecer pela função.

Tudo entra no diário de estudo como "Anatomia 3D"; o progresso fica no
aparelho (`atlas:anatomia:v1`).

- Modelo: `public/anatomia/ecorche.meshopt.glb` (6 MB, compressão meshopt).
  "Ecorche" de Charleeh, **CC BY-SA 4.0**, a partir do BodyParts3D (CC BY 4.0)
  e do Z-Anatomy (CC BY-SA 4.0). O crédito aparece no rodapé das páginas e
  num canto do treino, e não pode sair.
- Fichas: `src/lib/data/anatomia/miolab.json` — 146 estruturas (141 músculos)
  em 8 regiões, mais `musculos-atlas.json` com o que o MioLab deixou de fora
  (o oponente do dedo mínimo do pé, inconstante), cada uma com a camada (superficial/profunda) lida do modelo.
  Cada estrutura lista as peças do modelo pelo nome em inglês sem o lado
  (`meshKey`), e é isso que liga a malha tocada à ficha.
- Ossos: `src/lib/data/anatomia/ossos.json` — 52 ossos com ficha (classificação,
  articulações, acidentes, músculos que se prendem, o que passa pelos forames,
  ponto de prova), escritos para o Atlas com base em Moore e Netter, mais
  discos, cartilagens, dentes, orelha e olho com resumo. Cobrem as 165 peças do
  esqueleto do modelo. Gerado por um script a partir de uma lista revisável;
  para corrigir uma ficha, edite o JSON.
- Acidentes: `src/lib/data/anatomia/acidentes.json` — 120 pontos em 37 ossos,
  calculados sobre a malha de cada osso por `scripts/anatomia/acidentes.py`
  (regra por acidente: na faixa de altura do osso, o vértice mais extremo numa
  direção) e conferidos em folhas de vista anterior e lateral. O script lê o
  GLB com um decodificador do meshopt em Python puro (`glbgeom.py`, só numpy).
  O ponto guardado é o do lado esquerdo; o modelo é simétrico (mediana de
  0,9 mm entre o ponto espelhado e o osso direito), então o atlas espelha.
- Próximas etapas: nervos, tendões e ligamentos, que pedem um modelo com
  essas estruturas (Z-Anatomy).

## Administração (/admin)

Senha própria (`ATLAS_SENHA_ADMIN`), diferente da senha da turma; sem ela a
área não existe. Lá se publica um livro novo (PDF + ficha + disciplinas + origem
e autorização), anexa-se, substitui-se ou remove-se o PDF de qualquer registro,
oculta-se ou mostra-se um livro, e excluem-se registros criados pelo admin
(os que vêm dos planos só podem ser ocultados). Toda ação fica no log.

O upload vai do navegador direto ao storage (bucket R2 em produção, disco em
desenvolvimento), com barra de progresso e cancelamento. O servidor confere o
tamanho e a assinatura `%PDF-` antes de gravar o registro; ISBN repetido é
recusado e uma provável duplicata pede confirmação.

As alterações do admin ficam num **manifesto** (`storage/catalogo.json` local,
`catalogo/manifest.json` no bucket) que se soma às seeds em tempo de execução —
nada de rebuild. **Livros sem PDF e sem link aberto ficam ocultos por padrão**;
anexar um PDF os torna visíveis.

## Deploy: Vercel + Cloudflare R2

A aplicação roda na Vercel; os PDFs (≈2 GB) ficam num bucket **privado** do
Cloudflare R2, que não cobra tráfego de saída. Com as variáveis `R2_*`
definidas, o app deixa de servir do disco e passa a emitir links assinados
(1 h para leitura, 10 min para download) depois de checar a senha.

### 1. Cloudflare R2

1. Crie a conta em cloudflare.com → **R2 Object Storage** → _Create bucket_
   com o nome `atlas-livros` (deixe privado — não ative acesso público).
2. Em **Manage R2 API Tokens** → _Create API token_, permissão
   **Object Read & Write**, restrito ao bucket. Guarde _Access Key ID_ e
   _Secret Access Key_. O _Account ID_ aparece na página do R2.
3. No bucket, aba **Settings → CORS policy**, cole (troque o domínio):

   ```json
   [
     {
       "AllowedOrigins": ["https://SEU-PROJETO.vercel.app", "http://localhost:3000"],
       "AllowedMethods": ["GET", "HEAD", "PUT"],
       "AllowedHeaders": ["range", "content-type"],
       "ExposeHeaders": [
         "Content-Range",
         "Accept-Ranges",
         "Content-Length",
         "Content-Type",
         "ETag"
       ],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Sem isso o leitor não consegue buscar as páginas direto do bucket.

4. Preencha `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` e
   `R2_BUCKET` em `.env.local` e envie os arquivos:

   ```bash
   npm run upload:storage
   ```

   Reexecute sempre que colocar PDFs novos em `storage/livros`; só o que mudou
   é enviado. As figuras dos flashcards vão junto (`storage/flashcards`); para
   mandar só elas: `npm run upload:storage flashcards`.

### 2. Vercel

1. Suba o repositório para o GitHub (privado) e importe-o em vercel.com.
   Framework: Next.js; nada mais a configurar.
2. Em **Settings → Environment Variables**, cadastre `ATLAS_SENHA_TURMA`,
   `ATLAS_SENHA_ADMIN`, `ATLAS_COOKIE_SECRET` e as quatro `R2_*`.
3. Faça o deploy. Volte ao CORS do R2 e coloque a URL final do projeto.

Cada `git push` gera um deploy novo. Os PDFs não passam pelo Git nem pela
Vercel — vivem só no bucket.

### Alternativa: servidor próprio

Qualquer máquina com Node 20+ roda `npm run build && npm start` servindo os
PDFs de `storage/livros`, sem R2. Precisa de HTTPS na frente (Caddy resolve
em duas linhas) para o cookie de sessão ser aceito fora de `localhost`.

## Próximos passos previstos

1. Publicar na Vercel + R2 (seção acima).
2. Contas individuais (Supabase Auth) no lugar das senhas compartilhadas, com favoritos e histórico persistidos.
3. Edição de ficha (título, autores, temas) pela área administrativa.
4. Importação de novos planos de ensino com tela de revisão humana antes de salvar.
