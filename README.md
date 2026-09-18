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

## Próximos passos previstos

1. Publicar os PDFs que a turma tem direito de usar e ocultar os demais.
2. Área administrativa com upload pelo navegador (Zod + React Hook Form), em vez de copiar arquivos à mão.
3. Contas individuais (Supabase Auth) no lugar da senha única, com favoritos e histórico persistidos.
4. Importação de novos planos com tela de revisão humana antes de salvar.
