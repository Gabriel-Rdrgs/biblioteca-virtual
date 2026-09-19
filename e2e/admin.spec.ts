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
