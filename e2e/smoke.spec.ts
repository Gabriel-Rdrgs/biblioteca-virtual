import { expect, test } from "@playwright/test";

// When the class password is set, every test starts logged in; the gate test
// clears cookies itself to exercise the login flow.
test.beforeEach(async ({ page }) => {
  const senha = process.env.ATLAS_SENHA_TURMA;
  if (!senha) return;
  const response = await page.request.post("/api/entrar", {
    form: { senha, proximo: "/" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
});

test("home leads to the catalogue and back to a discipline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("bibliografia do semestre");

  await page.getByRole("link", { name: "Todos os livros" }).first().click();
  await expect(page).toHaveURL(/\/livros$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Todos os livros");

  await page
    .getByRole("link", { name: /tratado de histologia/i })
    .first()
    .click();
  await expect(page.getByText("Usado em 2 disciplinas").first()).toBeVisible();
  await expect(page.getByText("Capa ilustrativa gerada pelo Atlas")).toBeVisible();

  await page
    .getByRole("link", { name: /morfofuncional aplicado/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/disciplinas\/morfofuncional/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Morfofuncional");
});

test("catalogue search is accent-insensitive and filters combine", async ({ page }) => {
  await page.goto("/livros");
  const search = page.getByRole("searchbox", { name: "Buscar no catálogo" });
  await search.fill("etica");
  await expect(page.getByRole("link", { name: /ética em pesquisa/i })).toBeVisible();
  await search.fill("xyzabc");
  await expect(page.getByText("Nenhum livro encontrado")).toBeVisible();
});

test("global search reads the query from the URL", async ({ page }) => {
  await page.goto("/busca?q=bates");
  await expect(page.getByRole("link", { name: /propedêutica médica essencial/i })).toBeVisible();
});

test("a book without a posted file offers no download", async ({ page }) => {
  await page.goto("/livros/bates-propedeutica-medica-essencial");
  await expect(page.getByText("Arquivo ainda não disponibilizado", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /baixar|ler pdf/i })).toHaveCount(0);
  await expect(page.locator('a[href*="minhabiblioteca"]')).toHaveCount(0);
});

test("the class password gates every page and the plans", async ({ page }) => {
  test.skip(!process.env.ATLAS_SENHA_TURMA, "gate is open when ATLAS_SENHA_TURMA is unset");

  await page.context().clearCookies();
  await page.goto("/livros");
  await expect(page).toHaveURL(/\/entrar\?proximo=%2Flivros/);

  const plan = await page.request.get("/planos/ha-1.pdf", { maxRedirects: 0 });
  expect(plan.status()).toBe(307);

  await page.getByLabel("Senha da turma").fill("senha-errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Senha incorreta")).toBeVisible();

  await page.getByLabel("Senha da turma").fill(process.env.ATLAS_SENHA_TURMA ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/livros$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Todos os livros");
});

test("teaching plans are downloadable", async ({ page }) => {
  await page.goto("/planos-de-ensino");
  await expect(page.getByRole("link", { name: "Baixar" }).first()).toHaveAttribute(
    "href",
    /\/planos\/.+\.pdf$/,
  );
});

test("a class-posted book can be read and downloaded behind the password", async ({ page }) => {
  await page.goto("/livros/moore-anatomia-clinica");
  await expect(page.getByRole("link", { name: "Ler PDF" })).toBeVisible();
  await expect(page.getByText(/origem: enviado pela administração da turma/i)).toBeVisible();

  const file = await page.request.get("/api/arquivos/moore-anatomia-clinica", {
    maxRedirects: 0,
    headers: { Range: "bytes=0-0" },
  });
  // A one-byte range answers 206; a fresh clone with no files in
  // storage/livros answers 404. Never a redirect, never a non-PDF.
  expect([206, 404]).toContain(file.status());
  if (file.status() === 206) {
    expect(file.headers()["content-type"]).toBe("application/pdf");
    expect(file.headers()["content-range"]).toMatch(/^bytes 0-0\/\d+$/);
  }

  await page.getByRole("link", { name: "Ler PDF" }).click();
  // The reader page renders per request; give a cold server room.
  await expect(page).toHaveURL(/\/livros\/moore-anatomia-clinica\/ler$/, { timeout: 20_000 });
  // Page one is drawn by the in-page reader when the file is on disk.
  if (file.status() === 206) {
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel("Ir para a página")).toHaveValue("1");
  }
});
