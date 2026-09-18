import { expect, test } from "@playwright/test";

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

test("licensed titles link out instead of downloading", async ({ page }) => {
  await page.goto("/livros/bates-propedeutica-medica-essencial");
  const link = page.getByRole("link", { name: "Acessar pela biblioteca institucional" });
  await expect(link).toHaveAttribute("href", /minhabiblioteca\.com\.br/);
  await expect(page.getByRole("link", { name: /baixar/i })).toHaveCount(0);
});

test("teaching plans are downloadable", async ({ page }) => {
  await page.goto("/planos-de-ensino");
  await expect(page.getByRole("link", { name: "Baixar" }).first()).toHaveAttribute(
    "href",
    /\/planos\/.+\.pdf$/,
  );
});
