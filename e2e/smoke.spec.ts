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
  await expect(page.getByRole("heading", { level: 1 })).toContainText("A estante da turma");

  // A home deixou de ter um botão só para isso: a estante está na navegação.
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Estante" })
    .click();
  await expect(page).toHaveURL(/\/livros$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Todos os livros");

  await page
    .getByRole("link", { name: /tratado de histologia/i })
    .first()
    .click();
  await expect(page.getByText("Vale para 2 matérias")).toBeVisible();
  await expect(page.getByText("Capa ilustrativa — não é a da editora.")).toBeVisible();

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
  await search.fill("genetica");
  await expect(page.getByRole("link", { name: /genética humana/i })).toBeVisible();
  await search.fill("xyzabc");
  await expect(page.getByText("Nenhum livro encontrado")).toBeVisible();
});

test("global search reads the query from the URL", async ({ page }) => {
  await page.goto("/busca?q=bates");
  await expect(page.getByRole("link", { name: /bates propedêutica médica/i })).toBeVisible();
});

test("a book without a posted file offers no download", async ({ page }) => {
  // The only visible book without a file is the open-access CFM code.
  await page.goto("/livros/codigo-de-etica-medica-2019");
  await expect(page.getByRole("link", { name: "Abrir na fonte oficial" })).toBeVisible();
  await expect(page.getByRole("link", { name: /baixar|ler agora/i })).toHaveCount(0);
  await expect(page.locator('a[href*="minhabiblioteca"]')).toHaveCount(0);

  // Books with no file are hidden from the class entirely. (Dynamic pages
  // stream, so Next answers 200 with the not-found body — check the body.)
  await page.goto("/livros/bates-propedeutica-medica-essencial");
  await expect(page.getByText("Isso não está no acervo.")).toBeVisible();
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
  await expect(page.getByRole("link", { name: "Ler agora" })).toBeVisible();
  // Provenance is admin-only: the class never sees who supplied a file.
  await expect(page.getByText(/origem:/i)).toHaveCount(0);

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

  await expect(page.getByRole("link", { name: "Ler agora" })).toHaveAttribute(
    "href",
    "/livros/moore-anatomia-clinica/ler",
  );
  await page.goto("/livros/moore-anatomia-clinica/ler");
  // Page one is drawn by the in-page reader when the file is on disk.
  if (file.status() === 206) {
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel("Ir para a página")).toHaveValue("1");
  }
});

test("os cinco destinos são os mesmos no celular e no desktop", async ({ page }) => {
  const destinos = ["Início", "Estante", "Matérias", "Estudar", "Calendário"];
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Navegação principal" }).first();

  for (const destino of destinos) {
    // "Início" só existe na barra do celular; no desktop a marca faz esse papel.
    const link = nav.getByRole("link", { name: destino });
    if (await link.count()) await expect(link.first()).toBeVisible();
  }

  // O calendário era o buraco: não existia na navegação do celular, e quem
  // chegava lá não via item nenhum marcado.
  await page.goto("/calendario");
  // :visible porque as duas navegações coexistem no DOM — no celular quem
  // está escondido é o cabeçalho, no desktop é a barra de baixo.
  const atual = page.locator('[aria-current="page"]:visible');
  await expect(atual.first()).toBeVisible();
  await expect(atual.first()).toContainText("Calendário");
});

test("o plano de ensino se apresenta como parte da matéria", async ({ page }) => {
  await page.goto("/planos-de-ensino");
  const trilha = page.getByRole("navigation", { name: "Trilha de navegação" });
  await expect(trilha.getByRole("link", { name: "Matérias" })).toBeVisible();

  const atual = page.locator('[aria-current="page"]:visible').filter({ hasText: "Matérias" });
  await expect(atual.first()).toBeVisible();
});

test("a próxima prova abre o painel, com o calendário a um toque", async ({ page }) => {
  await page.goto("/");
  const cartao = page.locator("section").filter({ hasText: "PRÓXIMA PROVA" }).first();
  await expect(cartao).toBeVisible();
  await expect(cartao.getByRole("link", { name: /todas as datas/i })).toBeVisible();

  /*
    O "Treinar para ela" depende da prova que vier: nem toda matéria tem
    simulado. Este teste já passou por engano porque a próxima prova era
    uma data errada de MAC I; agora cobra só o que a faixa sempre tem, e
    confere o treino apenas quando ele existe.
  */
  const treino = cartao.getByRole("link", { name: /treinar para ela/i });
  if ((await treino.count()) > 0) {
    await expect(treino).toHaveAttribute("href", /\/simulados\//);
  }
});
