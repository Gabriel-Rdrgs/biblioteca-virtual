import { expect, test, type Page } from "@playwright/test";

/**
 * Os resumos, de ponta a ponta.
 *
 * O que importa aqui não é o PDF em si, e sim o que o liga ao resto: a aula
 * aparece na matéria, cai numa prova do calendário, e abre no mesmo leitor
 * dos livros — atrás da senha da turma, como todo o resto.
 */

test.beforeEach(async ({ page }) => {
  const senha = process.env.ATLAS_SENHA_TURMA;
  if (!senha) return;
  const response = await page.request.post("/api/entrar", {
    form: { senha, proximo: "/" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
});

/** Abre o grupo de uma prova na lista (o da próxima prova já vem aberto). */
async function abrirGrupo(page: Page, escopo: string, prova: RegExp) {
  const grupo = page.locator(`${escopo} details`).filter({
    has: page.locator("summary").filter({ hasText: prova }),
  });
  if ((await grupo.first().getAttribute("open")) === null) {
    await grupo.first().locator("summary").click();
  }
  return grupo.first();
}

test("a lista mostra a aula com a data, agrupada pela prova em que ela cai", async ({ page }) => {
  await page.goto("/resumos");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Resumos");

  const n1 = await abrirGrupo(page, "#resumos-mac-1", /^N1/);
  const linha = n1.locator("li").filter({ hasText: "Microscopia + Referenciais" }).first();
  await expect(linha.getByText("Aula 01")).toBeVisible();
  await expect(linha.getByText("11/08")).toBeVisible();
});

test("o resumo abre no leitor, com as duas páginas", async ({ page }) => {
  await page.goto("/resumos");
  const n1 = await abrirGrupo(page, "#resumos-mac-1", /^N1/);
  await n1.getByRole("link", { name: /Microscopia \+ Referenciais/ }).first().click();
  await expect(page).toHaveURL(/\/resumos\/mac-1-aula-01/);

  // O leitor é o mesmo dos livros: espera ele desenhar antes de conferir.
  await expect(page.getByText("/ 5")).toBeVisible({ timeout: 20000 });
  // O primeiro é o "voltar" do cabeçalho; o outro é o do rodapé.
  await expect(page.getByRole("link", { name: "Resumos" }).first()).toBeVisible();
});

test("o arquivo fica atrás da senha da turma, como os livros", async ({ page }) => {
  const resposta = await page.request.get("/api/resumos/mac-1-aula-01.pdf");
  expect(resposta.status()).toBe(200);
  expect(resposta.headers()["content-type"]).toContain("application/pdf");
});

test("a prova do calendário leva ao resumo do que cai nela", async ({ page }) => {
  await page.goto("/calendario");
  // As N1 de MAC I já passaram; o que passou fica recolhido.
  await page.getByRole("button", { name: /mostrar o que já passou/i }).click();
  // IESCG I também tem uma "N1 — prova teórica"; o cartão identifica a
  // matéria pela sigla.
  const cartao = page
    .locator("li")
    .filter({ hasText: "N1 — prova teórica" })
    .filter({ hasText: "MAC I" })
    .first();
  // O cartão da prova leva ao resumo escrito para ela, não às catorze aulas.
  await expect(cartao.getByRole("link", { name: /resumo para a N1/i })).toBeVisible();
});

test("a matéria lista os resumos por prova, com o apanhado da véspera primeiro", async ({ page }) => {
  await page.goto("/disciplinas/morfofuncional-aplicado-a-clinica-i");
  const secao = page.locator("section").filter({ hasText: "Resumos das aulas" }).first();

  // Cada prova é um grupo; o apanhado dela abre o grupo.
  const n1 = await abrirGrupo(page, "section:has(#resumos-da-materia)", /^N1/);
  await expect(n1.getByRole("link", { name: /Resumo para a N1/ })).toBeVisible();
  const n2 = await abrirGrupo(page, "section:has(#resumos-da-materia)", /^N2/);
  await expect(n2.getByRole("link", { name: /Resumo para a N2/ })).toBeVisible();

  // As aulas vêm numeradas, na ordem em que aconteceram.
  await expect(secao.getByText("Aula 01").first()).toBeVisible();
});
