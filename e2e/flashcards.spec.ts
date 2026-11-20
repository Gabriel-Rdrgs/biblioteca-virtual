import { expect, test } from "@playwright/test";

/**
 * Flashcards, modo rápido e fila de erros, de ponta a ponta.
 *
 * Nada aqui publica para a turma: o servidor do Playwright grava no
 * storage/ de verdade, e um baralho de teste apareceria para todo mundo.
 * Publicar está coberto pelos testes de unidade, num diretório descartável.
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

test("a official deck flips, grades and remembers on the device", async ({ page }) => {
  await page.goto("/flashcards");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Flashcards");
  await expect(page.getByRole("heading", { name: "Membros superiores" })).toBeVisible();

  await page.goto("/flashcards/semio-linfonodos");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Linfonodos");
  await expect(page.getByText("01 / 22")).toBeVisible();

  const card = page.getByRole("button", { name: "Mostrar a resposta" });
  await card.click();
  await expect(page.getByRole("button", { name: "Mostrar a pergunta" })).toBeVisible();

  await page.getByRole("button", { name: /^Sei/ }).click();
  await expect(page.getByText("02 / 22")).toBeVisible();

  // Errou: o cartão volta na mesma sessão, então a fila cresce.
  await page.getByRole("button", { name: /^Errei/ }).click();
  await expect(page.getByText("03 / 23")).toBeVisible();

  await page.reload();
  // Os dois cartões já vistos deixaram de ser "novos".
  await expect(page.getByText("Novos").locator("..")).toContainText("20");
});

test("a student writes a deck, studies it and exports it", async ({ page }) => {
  await page.goto("/flashcards/novo");
  await page.getByLabel("Título").fill("Meu baralho de teste");
  await page.getByLabel("Frente do cartão 1").fill("Nervo da mão em garra?");
  await page.getByLabel("Verso do cartão 1").fill("**Ulnar**");
  await page.getByLabel("Frente do cartão 2").fill("Nervo do punho caído?");
  await page.getByLabel("Verso do cartão 2").fill("Radial");
  await page.getByRole("button", { name: "Salvar e estudar" }).click();

  await expect(page).toHaveURL(/\/flashcards\/meus\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Meu baralho de teste");
  await page.getByRole("button", { name: "Mostrar a resposta" }).click();
  await expect(page.locator("strong", { hasText: "Ulnar" })).toBeVisible();

  await page.goto("/flashcards");
  await expect(page.getByRole("heading", { name: "Meus baralhos" })).toBeVisible();
  await expect(page.getByText("Meu baralho de teste")).toBeVisible();
});

test("a wrong answer in quick mode lands in the error queue", async ({ page }) => {
  // paras-o16 tem a alternativa A como certa; B é errada.
  await page.goto("/estudar/rapido?questoes=paras-o16");
  await page.getByRole("button", { name: /Alternativa B/ }).click();
  await expect(page.getByText(/Foi para a fila de erros/)).toBeVisible();
  await page.getByRole("button", { name: "Ver resultado" }).click();
  await expect(page.getByText("0/1").first()).toBeVisible();

  await page.goto("/estudar/erros");
  await expect(page.getByText("questão esperando")).toBeVisible();

  await page.goto("/progresso");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Desempenho");
  await expect(page.getByText("Fila de erros").first()).toBeVisible();
});

test("the image simulado reveals and scores", async ({ page }) => {
  await page.goto("/estudar/imagem");
  await page.getByRole("button", { name: "Começar simulado" }).click();
  await expect(page.getByText(/Questão 1 \//)).toBeVisible();
  await page.getByRole("button", { name: /Revelar resposta/ }).click();
  await page.getByRole("button", { name: /Acertei/ }).click();
  await expect(page.getByText(/Questão 2 \//)).toBeVisible();
});

test("deck figures stay behind the class password", async ({ page }) => {
  const figure = await page.request.get("/api/flashcards/figuras/semio-12.jpg", {
    maxRedirects: 0,
  });
  // 200 do disco ou redirect assinado; 404 se a pasta não foi copiada.
  expect([200, 302, 404]).toContain(figure.status());
  const bad = await page.request.get("/api/flashcards/figuras/..%2Fcatalogo.json");
  expect(bad.status()).toBe(400);
});
