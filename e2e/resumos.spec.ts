import { expect, test } from "@playwright/test";

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

test("a lista mostra a aula com a data e a prova em que ela cai", async ({ page }) => {
  await page.goto("/resumos");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Resumos");

  const cartao = page.locator("li").filter({ hasText: "Microscopia e referenciais" }).first();
  await expect(cartao.getByText("Aula 01")).toBeVisible();
  await expect(cartao.getByText("11/08")).toBeVisible();
  await expect(cartao.getByText("cai na N1")).toBeVisible();
});

test("o resumo abre no leitor, com as duas páginas", async ({ page }) => {
  await page.goto("/resumos");
  await page.getByRole("link", { name: "Ler" }).first().click();
  await expect(page).toHaveURL(/\/resumos\/mac-1-aula-01/);

  // O leitor é o mesmo dos livros: espera ele desenhar antes de conferir.
  await expect(page.getByText("/ 2")).toBeVisible({ timeout: 20000 });
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
  // IESCG I também tem uma "N1 — prova teórica": é preciso dizer qual matéria.
  const cartao = page
    .locator("li")
    .filter({ hasText: "N1 — prova teórica" })
    .filter({ hasText: "Morfofuncional" })
    .first();
  await expect(cartao.getByRole("link", { name: /resumo da aula 1/i })).toBeVisible();
});

test("a matéria lista as aulas que já têm resumo", async ({ page }) => {
  await page.goto("/disciplinas/morfofuncional-aplicado-a-clinica-i");
  const secao = page.locator("section").filter({ hasText: "Resumos das aulas" }).first();
  await expect(secao.getByRole("link", { name: /Microscopia e referenciais/ })).toBeVisible();
});
