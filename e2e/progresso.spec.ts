import { expect, test, type Page } from "@playwright/test";

/**
 * Progress is built from attempts kept on the device, so these tests take
 * real simulados in the browser rather than seeding storage by hand.
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

/** The card of one statistic, found by its label. */
function stat(page: Page, label: string) {
  return page.locator("section div").filter({ hasText: label }).last();
}

/**
 * Takes a drill of three objective questions, answering the first option
 * every time, and corrects it. Returns once the result is on screen.
 */
async function takeDrill(page: Page, questions: string[]) {
  await page.goto(`/simulados/treino?materia=mac-1&questoes=${questions.join(",")}`);
  await expect(page.getByText(`de ${questions.length} respondidas`)).toBeVisible();

  for (let i = 0; i < questions.length; i++) {
    await page.locator("ul li button[aria-pressed]").first().click();
    const next = page.getByRole("button", { name: "Próxima" });
    if (await next.isVisible()) await next.click();
  }
  await page.getByRole("button", { name: "Corrigir" }).first().click();
  await expect(page.getByRole("heading", { name: "Resultado" })).toBeVisible();
}

test("progress starts empty and explains what to do", async ({ page }) => {
  await page.goto("/progresso");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Meu progresso");
  await expect(page.getByText("Nada aqui ainda")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver os simulados" })).toBeVisible();
});

test("a corrected simulado shows up, and a second attempt shows the trend", async ({ page }) => {
  // paras-o16 is the only one of these three whose first option is right.
  const questions = ["paras-o16", "paras-o41", "paras-o58"];
  await takeDrill(page, questions);

  await page.goto("/progresso");
  await expect(stat(page, "simulado feito")).toContainText("1");
  await expect(stat(page, "questões respondidas")).toContainText("3");
  // One attempt cannot show a trend, and the page says so.
  await expect(page.getByText(/faça outro para ver se melhorou/i)).toBeVisible();

  // The weak axes are listed by where the person stands.
  await expect(page.getByRole("heading", { name: "O que ainda está fraco" })).toBeVisible();

  await takeDrill(page, questions);
  await page.goto("/progresso");
  await expect(stat(page, "simulados feitos")).toContainText("2");
  await expect(page.getByText(/o traço, onde estava na primeira vez/i)).toBeVisible();
  await expect(page.getByText("2 tentativas")).toBeVisible();
});

test("the history is on the device and can be erased", async ({ page }) => {
  await takeDrill(page, ["paras-o16", "paras-o17"]);
  await page.goto("/progresso");
  await expect(stat(page, "simulado feito")).toContainText("1");
  await expect(page.getByText(/Só neste aparelho/)).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Apagar meu histórico" }).click();
  await expect(page.getByText("Nada aqui ainda")).toBeVisible();

  // And it really is gone after a reload, not just from the view.
  await page.reload();
  await expect(page.getByText("Nada aqui ainda")).toBeVisible();
});

test("progress is not shared between devices", async ({ page, browser }) => {
  await takeDrill(page, ["paras-o16", "paras-o17"]);
  await page.goto("/progresso");
  await expect(stat(page, "simulado feito")).toContainText("1");

  // A second browser context stands in for another phone.
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  const senha = process.env.ATLAS_SENHA_TURMA;
  if (senha) {
    await otherPage.request.post("/api/entrar", { form: { senha, proximo: "/" } });
  }
  await otherPage.goto("/progresso");
  await expect(otherPage.getByText("Nada aqui ainda")).toBeVisible();
  await other.close();
});
