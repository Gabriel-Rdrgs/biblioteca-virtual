import { expect, test, type Page } from "@playwright/test";

/**
 * The exam calendar: the dates transcribed from the teaching plans, and
 * what the admin can do on top of them. Serial, because these share one
 * manifest file.
 */

test.describe.configure({ mode: "serial" });

const ADMIN = process.env.ATLAS_SENHA_ADMIN;
const CLASS = process.env.ATLAS_SENHA_TURMA;

/**
 * A date N days from today, as YYYY-MM-DD, in the local calendar.
 *
 * Not toISOString(): that one is UTC, so between midnight UTC and midnight
 * local the two disagree by a day, and the countdown the app computes
 * locally would come out one off.
 */
function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-");
}

async function loginAdmin(page: Page) {
  const response = await page.request.post("/api/admin/entrar", {
    form: { senha: ADMIN ?? "", proximo: "/admin" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
}

async function loginClass(page: Page) {
  if (!CLASS) return;
  await page.request.post("/api/entrar", { form: { senha: CLASS, proximo: "/" } });
}

test.describe("calendário de provas", () => {
  test.skip(!ADMIN || !CLASS, "needs ATLAS_SENHA_ADMIN and ATLAS_SENHA_TURMA");

  test("carries the dates from the teaching plans, with their source", async ({ page }) => {
    await loginClass(page);
    await page.goto("/calendario");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Calendário de provas");

    // A date the plans state, and the page says where it came from.
    await expect(
      page.getByText("Plano de ensino de MAC I, cronograma, p. 10").first(),
    ).toBeVisible();
    await expect(page.getByText("N2 — prova teórica").first()).toBeVisible();

    // The plans all warn their schedule may move, and so does the page.
    await expect(page.getByText(/cronograma pode sofrer ajustes/i)).toBeVisible();

    // Past assessments are kept, below.
    await expect(page.getByRole("heading", { name: "Já passaram" })).toBeVisible();
  });

  test("a prova counts down, a devolutiva does not shout", async ({ page }) => {
    await loginClass(page);
    await page.goto("/calendario");
    // Both kinds are listed; only an exam gets the primary badge.
    const devolutiva = page.locator("li").filter({ hasText: "Devolutiva da N2" }).first();
    await expect(devolutiva).toBeVisible();
    await expect(
      page.locator("li").filter({ hasText: "N2 — prova teórica" }).first(),
    ).toBeVisible();
  });

  test("the home leads with an exam, not with a hand-in", async ({ page }) => {
    await loginClass(page);
    await page.goto("/");
    await expect(page.getByText("Próxima prova")).toBeVisible();
    // Whatever is next, the band must not be counting down to a devolutiva.
    await expect(page.getByText(/Próxima prova/).locator("..")).not.toContainText("Devolutiva");
  });

  test("a date from a plan can be hidden, but never deleted", async ({ page }) => {
    await page.context().clearCookies();
    await loginAdmin(page);

    const removal = await page.request.delete("/api/admin/provas/mac-1-n2-teorica");
    expect(removal.status()).toBe(400);
    expect((await removal.json()).error).toContain("só podem ser ocultadas");

    const hidden = await page.request.patch("/api/admin/provas/mac-1-n2-teorica", {
      data: { visibility: "oculto" },
    });
    expect(hidden.ok()).toBe(true);
    await page.goto("/calendario");
    await expect(page.getByText("N2 — prova teórica")).toHaveCount(0);

    // Correcting the date keeps the record of where it came from.
    const moved = await page.request.patch("/api/admin/provas/mac-1-n2-teorica", {
      data: { visibility: "visivel", date: inDays(4) },
    });
    expect(moved.ok()).toBe(true);
    await page.goto("/calendario");
    await expect(page.getByText("em 4 dias")).toBeVisible();
    await expect(
      page.getByText("Plano de ensino de MAC I, cronograma, p. 10").first(),
    ).toBeVisible();
  });

  test("the admin can add a date of their own and delete it", async ({ page }) => {
    await page.context().clearCookies();
    await loginAdmin(page);

    const created = await page.request.post("/api/admin/provas", {
      data: {
        disciplineId: "mac-1",
        kind: "N1",
        title: "Prova surpresa",
        date: inDays(2),
        room: "Bloco B, sala 204",
        content: ["Tudo."],
        examIds: ["mac-1-n1-completo"],
      },
    });
    expect(created.status()).toBe(201);
    const { id } = (await created.json()) as { id: string };

    await page.goto("/calendario");
    // Scoped to its own card: the N1 from the plan links to the same
    // simulado, so a page-wide match would hit two.
    const card = page.locator("li").filter({ hasText: "Prova surpresa" }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText("Bloco B, sala 204")).toBeVisible();
    await expect(card.getByRole("link", { name: /Treinar: MAC I completo/ })).toBeVisible();

    const removed = await page.request.delete(`/api/admin/provas/${id}`);
    expect(removed.ok()).toBe(true);
    await page.goto("/calendario");
    await expect(page.getByText("Prova surpresa")).toHaveCount(0);
  });

  test("the admin form refuses a malformed date and an unknown matéria", async ({ page }) => {
    await page.context().clearCookies();
    await loginAdmin(page);

    const badDate = await page.request.post("/api/admin/provas", {
      data: { disciplineId: "mac-1", kind: "N1", date: "14/11/2026" },
    });
    expect(badDate.status()).toBe(400);

    const badDiscipline = await page.request.post("/api/admin/provas", {
      data: { disciplineId: "nao-existe", kind: "N1", date: inDays(10) },
    });
    expect(badDiscipline.status()).toBe(400);
    expect((await badDiscipline.json()).error).toContain("Matéria desconhecida");
  });

  test("the class cannot write to the calendar", async ({ page }) => {
    await page.context().clearCookies();
    await loginClass(page);
    const response = await page.request.post("/api/admin/provas", {
      data: { disciplineId: "mac-1", kind: "N1", date: inDays(5) },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(401);
  });
});

test("a date that moved says so, and shows what the plan had said", async ({ page }) => {
  if (!CLASS) return;
  await loginClass(page);
  await page.goto("/calendario");

  const card = page.locator("li").filter({ hasText: "Iniciação Científica I" }).first();
  await expect(card.getByText("data alterada")).toBeVisible();
  await expect(card.getByText(/O plano previa 8 de outubro/)).toBeVisible();
  await expect(card.getByText(/informado pela turma/i)).toBeVisible();
});

test("an N2 that is cumulative says so, with the page that says it", async ({ page }) => {
  if (!CLASS) return;
  await loginClass(page);
  await page.goto("/calendario");

  const card = page.locator("li").filter({ hasText: "N2 — avaliação somativa tutorial" }).first();
  await expect(card.getByText(/problemas 1 a 4, cobrados na N1/i)).toBeVisible();
  await expect(
    card.getByText(/acumulativo conforme o plano de ensino de AES 2, p\. 8/i),
  ).toBeVisible();
});
