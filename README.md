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
   é enviado.

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
