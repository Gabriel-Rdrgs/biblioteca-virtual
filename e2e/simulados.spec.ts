import { expect, test, type Page } from "@playwright/test";

/**
 * The simulado flow end to end: answer, correct, read the axis map.
 *
 * The scoring itself is covered by unit tests; what matters here is that an
 * attempt survives a reload, that the figures are served behind the gate,
 * and that correcting really produces the feedback the student came for.
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

async function openExam(page: Page) {
  await page.goto("/simulados/mac-1-n1-parasitologia/fazer");
  await expect(page.getByText("de 60 respondidas")).toBeVisible();
}

/** Jumps to a question through the palette. */
async function goToQuestion(page: Page, number: string) {
  await page.getByRole("button", { name: "Ver todas as questões" }).click();
  await page.getByRole("button", { name: number, exact: true }).click();
}

test("the simulado is listed with its bank and opens its cover", async ({ page }) => {
  await page.goto("/simulados");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Simulados");
  // Both áreas of MAC I appear with the size of their bank.
  await expect(page.getByText("Anatomia clínica").first()).toBeVisible();
  await expect(page.getByText("Parasitologia").first()).toBeVisible();
  await expect(page.getByText("60 questões").first()).toBeVisible();

  // Three simulados share the page, so pick the one by its own card.
  await page
    .locator("li")
    .filter({ hasText: "Simulado N1 — Parasitologia" })
    .getByRole("link", { name: "Abrir" })
    .click();
  await expect(page).toHaveURL(/\/simulados\/mac-1-n1-parasitologia$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Simulado N1 — Parasitologia");
  // Cover states the shape of the exam.
  await expect(page.getByText("discursivas").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Baixar para imprimir/ })).toBeVisible();
});

test("figures are served behind the class password", async ({ page }) => {
  const figure = await page.request.get("/api/simulados/paras-fig-02.png", { maxRedirects: 0 });
  // 200 from disk, or a signed redirect when running against R2.
  expect([200, 302]).toContain(figure.status());
  if (figure.status() === 200) {
    expect(figure.headers()["content-type"]).toBe("image/png");
    expect((await figure.body()).length).toBeGreaterThan(1000);
  }

  await page.context().clearCookies();
  const gated = await page.request.get("/api/simulados/paras-fig-02.png", { maxRedirects: 0 });
  if (process.env.ATLAS_SENHA_TURMA) expect(gated.status()).toBe(307);
});

test("a question with a figure shows it with its attribution", async ({ page }) => {
  await openExam(page);
  await goToQuestion(page, "2");
  const image = page.locator("figure img").first();
  await expect(image).toBeVisible();
  await expect(image).toHaveJSProperty("naturalWidth", 610);
  await expect(page.getByText(/Parasitologia Contemporânea, fig\. 8\.6/)).toBeVisible();
});

test("an answer survives a reload, because it is kept on the device", async ({ page }) => {
  await openExam(page);
  await goToQuestion(page, "16");
  await page.getByRole("button", { name: /reservatório animal de uma zoonose/ }).click();
  await expect(page.getByText("1 de 60 respondidas")).toBeVisible();

  await page.reload();
  await expect(page.getByText("1 de 60 respondidas")).toBeVisible();
  await goToQuestion(page, "16");
  await expect(
    page.getByRole("button", { name: /reservatório animal de uma zoonose/ }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("correcting scores the objectives and maps the weak axes", async ({ page }) => {
  await openExam(page);

  // Three questions of one axis, answered right; everything else left blank.
  await goToQuestion(page, "16");
  await page.getByRole("button", { name: /reservatório animal de uma zoonose/ }).click();
  await goToQuestion(page, "17");
  await page.getByRole("button", { name: "I, II e III." }).click();
  await goToQuestion(page, "18");
  await page.getByRole("button", { name: /comensalismo/ }).click();

  await page.getByRole("button", { name: "Corrigir" }).first().click();

  // Discursives come first: self-assessment against the marking scheme.
  await expect(page.getByRole("heading", { name: "Corrija suas discursivas" })).toBeVisible();
  await page.getByRole("button", { name: "Ver o resultado" }).click();

  await expect(page.getByRole("heading", { name: "Resultado" })).toBeVisible();
  // 3 of 45 objectives right, nothing on the discursives.
  await expect(page.getByText("3,0 de 60 pontos")).toBeVisible();

  // Three of the four points of that axis: the objectives were right, the
  // discursive was left blank, so it lands in the middle band.
  const intro = page
    .locator("li")
    .filter({ hasText: "Introdução à Parasitologia" })
    .filter({ hasText: "/ 4 ·" })
    .first();
  await expect(intro.getByText("quase lá")).toBeVisible();
  await expect(intro.getByText("3,0 / 4 · 75%")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Comece por aqui" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Refazer as \d+ que errei/ })).toBeVisible();
});

test("a drill is composed from the bank and can be redone from wrong answers", async ({ page }) => {
  await page.goto("/simulados/treino?materia=mac-1&partes=parasitologia:1:5");
  await expect(page.getByText("de 6 respondidas")).toBeVisible();
  await expect(page.getByText("Treino").first()).toBeVisible();

  // Rebuilding from a set of ids yields exactly those questions.
  await page.goto("/simulados/treino?materia=mac-1&questoes=paras-o16,paras-o41,paras-o58");
  await expect(page.getByText("de 3 respondidas")).toBeVisible();
  await expect(page.getByText("Refazendo o que errei").first()).toBeVisible();
});

test("asking for a drill with no recipe explains what to do", async ({ page }) => {
  await page.goto("/simulados/treino");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Monte o treino primeiro");
});

test("the result points at the chapter that fixes the weak axis", async ({ page }) => {
  // A drill of one teníase question, answered wrong on purpose.
  await page.goto("/simulados/treino?materia=mac-1&questoes=paras-o41");
  await page.locator("ul li button[aria-pressed]").first().click();
  await page.getByRole("button", { name: "Corrigir" }).first().click();
  await expect(page.getByRole("heading", { name: "Resultado" })).toBeVisible();

  const reading = page.getByRole("link", { name: /Os Cestoides/ }).first();
  await expect(reading).toBeVisible();
  await expect(reading).toHaveAttribute(
    "href",
    "/livros/parasitologia-contemporanea/ler?pagina=751",
  );

  // And the link really opens the reader on that page.
  await reading.click();
  await expect(page).toHaveURL(/\/livros\/parasitologia-contemporanea\/ler\?pagina=751$/);
  await expect(page.getByLabel("Ir para a página")).toHaveValue("751", { timeout: 60_000 });
});
