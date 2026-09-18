# Atlas — Biblioteca Médica

Biblioteca de referência da turma de Medicina do 1º período do UNIEURO, semestre 2026.2.
Reúne, em um só catálogo, a bibliografia das sete unidades curriculares — transcrita
diretamente dos planos de ensino oficiais, com proveniência rastreável por seção e página.

## Regra central

**Um livro, muitas disciplinas.** Cada título existe uma única vez em `src/lib/data/books.ts`
e se relaciona com as disciplinas por `src/lib/data/book-disciplines.ts`, que registra o tipo
de bibliografia (básica, básica virtual, complementar, outras referências) em cada uma.
Quatro títulos aparecem em dois planos e têm um só registro.

## Direitos autorais

O Atlas cataloga **referências**, não cópias.

- Títulos licenciados (`accessType: "institutional"`) mostram a referência completa e um botão
  para a plataforma Minha Biblioteca. Nenhum arquivo comercial é hospedado.
- Títulos sem link nem arquivo (`reference_only`) mostram _"Referência catalogada — arquivo
  ainda não disponibilizado"_.
- Os planos de ensino, em `public/planos/`, são documentos institucionais e podem ser baixados.

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
npm run e2e          # testes end-to-end (requer: npx playwright install chromium)
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
    repository/           a fronteira de dados
tests/                    Vitest
e2e/                      Playwright
docs/extracao-planos/     texto extraído de cada PDF, para auditoria
public/planos/            os 7 planos de ensino
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

1. Área administrativa com formulários (Zod + React Hook Form) e upload desacoplado.
2. Supabase: schema equivalente ao modelo de domínio, RLS, storage com URLs assinadas.
3. Importação de PDF com tela de revisão humana antes de salvar.
4. Autenticação, favoritos persistidos e histórico de leitura.
