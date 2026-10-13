import { expect, test, type Page } from "@playwright/test";

const ADMIN = process.env.ATLAS_SENHA_ADMIN;
const CLASS = process.env.ATLAS_SENHA_TURMA;

/** The smallest PDF a viewer will accept — one blank page. */
function tinyPdf(): Buffer {
  const objects = [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Kids[3 0 R]/Count 1>>",
    "<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 450]>>",
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  body += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}

async function loginAdmin(page: Page) {
  const response = await page.request.post("/api/admin/entrar", {
    form: { senha: ADMIN ?? "", proximo: "/admin" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
}

test.describe.configure({ mode: "serial" });

test.describe("admin area", () => {
  test.skip(!ADMIN || !CLASS, "needs ATLAS_SENHA_ADMIN and ATLAS_SENHA_TURMA");

  test("the class password does not open the admin area", async ({ page }) => {
    await page.context().clearCookies();
    await page.request.post("/api/entrar", { form: { senha: CLASS ?? "", proximo: "/" } });
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/entrar/);

    const api = await page.request.post("/api/admin/upload-url", {
      data: { name: "x.pdf", sizeBytes: 10 },
      maxRedirects: 0,
    });
    expect(api.status()).toBe(401);
  });

  test("publish a book with a PDF, hide it, show it, delete it", async ({ page }) => {
    await page.context().clearCookies();
    await loginAdmin(page);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Acervo da turma");

    const title = `Livro de teste E2E ${Date.now()}`;

    // 1. upload
    await page.locator("#novo-file").setInputFiles({
      name: "teste-e2e.pdf",
      mimeType: "application/pdf",
      buffer: tinyPdf(),
    });
    await expect(page.getByText(/teste-e2e\.pdf .* enviado/)).toBeVisible({ timeout: 20_000 });

    // 2. record
    await page.locator("#nb-title").fill(title);
    await page.locator("#nb-authors").fill("TESTE, Autora");
    await page.locator("#nb-publisher").fill("Editora de Teste");
    await page.locator("#nb-year").fill("2026");
    await page.locator("#nb-topics").fill("teste, e2e");
    await page.getByLabel("Humanidades Médicas I").check();
    await page.locator("#nb-origin").fill("Gerado pelo teste automatizado");
    await page.locator("#nb-auth").fill("Arquivo sintético, sem conteúdo");
    await page.getByRole("button", { name: "Publicar livro" }).click();
    await expect(page.getByText("Livro publicado.")).toBeVisible({ timeout: 20_000 });

    // 3. visible to the class
    await page.goto("/livros");
    await page.getByRole("searchbox", { name: "Buscar no catálogo" }).fill("teste e2e");
    const link = page.getByRole("link", { name: new RegExp(title) });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.getByText("Usado em", { exact: false })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Ler agora" })).toBeVisible();
    // The admin session sees the file's provenance; the class would not.
    await expect(page.getByText(/gerado pelo teste automatizado/i)).toBeVisible();
    const slug = new URL(page.url()).pathname.split("/").pop() ?? "";

    // 4. hide, then show
    await page.goto("/admin");
    const row = page.locator("li", { hasText: title }).first();
    await row.getByRole("button", { name: "Ocultar" }).click();
    await expect(page.getByText(`“${title}” ocultado.`)).toBeVisible();
    const hidden = await page.request.get(`/livros/${slug}`);
    expect(await hidden.text()).toContain("Isso não está no acervo.");
    await row.getByRole("button", { name: "Mostrar" }).click();
    await expect(page.getByText(`“${title}” visível.`)).toBeVisible();
    const shown = await page.request.get(`/livros/${slug}`);
    expect(await shown.text()).toContain("Ler agora");

    // 5. delete the record and its file
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Excluir registro" }).click();
    await expect(page.getByText(`“${title}” excluído.`)).toBeVisible();
    const gone = await page.request.get(`/livros/${slug}`);
    expect(await gone.text()).toContain("Isso não está no acervo.");
    await expect(page.getByText("Registro excluído").first()).toBeVisible();
  });

  test("a seed record can be hidden but never deleted", async ({ page }) => {
    await page.context().clearCookies();
    await loginAdmin(page);
    const response = await page.request.delete(
      "/api/admin/livros/moore-anatomia-clinica?registro=1",
    );
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toContain("só podem ser ocultados");
  });

  test("rejects an upload that is not a PDF", async ({ page }) => {
    await page.context().clearCookies();
    await loginAdmin(page);
    await page.goto("/admin");
    await page.locator("#novo-file").setInputFiles({
      name: "nao-e-pdf.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("isto nao e um pdf"),
    });
    await expect(page.getByText("Escolha um arquivo PDF válido.")).toBeVisible();
  });
});

test.describe("disciplines and periods", () => {
  test.skip(!ADMIN || !CLASS, "needs ATLAS_SENHA_ADMIN and ATLAS_SENHA_TURMA");

  test("create a 2nd-period discipline with a plan, see it grouped, then delete it", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await loginAdmin(page);
    await page.goto("/admin");

    const name = `Matéria de teste ${Date.now()}`;
    await page.locator("#md-name").fill(name);
    await page.locator("#md-short").fill(`T${Date.now() % 10000}`);
    await page.locator("#md-period").selectOption("2");
    await page.locator("#md-semester").fill("2027.1");
    await page.locator("#md-desc").fill("Ementa de teste com comprimento suficiente para passar.");
    await page
      .locator("#md-syllabus")
      .fill("Unidade I\nItem um\nItem dois\n\nUnidade II\nItem três");
    await page.locator("#md-plano-file").setInputFiles({
      name: "plano-teste.pdf",
      mimeType: "application/pdf",
      buffer: tinyPdf(),
    });
    await expect(page.getByText(/plano-teste\.pdf .* enviado/)).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Criar matéria" }).click();
    await expect(page.getByText("Matéria criada.")).toBeVisible({ timeout: 20_000 });

    // Grouped under its period on the public page.
    await page.goto("/disciplinas");
    await expect(page.getByRole("heading", { name: "2º período" })).toBeVisible();
    const link = page.getByRole("link", { name });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    await expect(page.getByRole("heading", { name: "Unidade II" })).toBeVisible();
    const planHref = await page
      .getByRole("link", { name: "Ver plano de ensino" })
      .getAttribute("href");
    expect(planHref).toMatch(/^\/api\/planos\//);
    const plan = await page.request.get(planHref ?? "");
    expect(plan.status()).toBe(200);
    expect(plan.headers()["content-type"]).toBe("application/pdf");

    // Clean up.
    await page.goto("/admin");
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .locator("li", { hasText: name })
      .filter({ has: page.getByRole("button", { name: "Excluir" }) })
      .first()
      .getByRole("button", { name: "Excluir" })
      .click();
    await expect(page.getByText(`“${name}” excluída.`)).toBeVisible();
  });

  test("the current period can be changed and drives the home page", async ({ page }) => {
    await page.context().clearCookies();
    await loginAdmin(page);
    await page.goto("/admin");
    await page.locator("#periodo-atual").selectOption("1");
    await expect(page.getByText("Período atual: 1º período.")).toBeVisible();
    await page.goto("/");
    await expect(page.getByText("Medicina · 1º período · UNIEURO")).toBeVisible();
  });
});
