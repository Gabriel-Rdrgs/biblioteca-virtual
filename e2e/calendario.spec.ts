import { expect, test, type Page } from "@playwright/test";

/**
 * The exam calendar, from the admin entering a date to the class seeing the
 * countdown. Tests run serially because they share one manifest file.
 */

test.describe.configure({ mode: "serial" });

const ADMIN = process.env.ATLAS_SENHA_ADMIN;
const CLASS = process.env.ATLAS_SENHA_TURMA;

/**
 * A date N days from today, as YYYY-MM-DD, in the local calendar.
 *
 * Not toISOString(): that one is UTC, so between midnight UTC and
 * midnight local the two disagree by a day, and the countdown the app
 * computes locally would come out one off.
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

  test("the class is told plainly when no date has been entered", async ({ page }) => {
    await loginClass(page);
    await page.goto("/calendario");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Calendário de provas");
    await expect(page.getByText("Nenhuma data cadastrada ainda")).toBeVisible();
  });

  test("a date entered by the admin reaches the calendar, the home and the matéria", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await loginAdmin(page);

    const date = inDays(5);
    const created = await page.request.post("/api/admin/provas", {
      data: {
        disciplineId: "mac-1",
        kind: "N1",
        date,
        time: "19:00",
        room: "Bloco B, sala 204",
        weight: "6,0",
        content: ["Anatomia: crânio e coluna", "Parasitologia: protozoários"],
        examIds: ["mac-1-n1-completo"],
      },
    });
    expect(created.status()).toBe(201);
    const { id } = (await created.json()) as { id: string };

    // The calendar shows it with the urgency of a date five days out.
    await page.goto("/calendario");
    await expect(page.getByText("em 5 dias")).toBeVisible();
    await expect(page.getByText("Bloco B, sala 204")).toBeVisible();
    await expect(page.getByText("Anatomia: crânio e coluna")).toBeVisible();
    await expect(page.getByRole("link", { name: /Treinar: MAC I completo/ })).toBeVisible();

    // The home carries the countdown.
    await page.goto("/");
    await expect(page.getByText("Próxima prova")).toBeVisible();
    await expect(page.getByText("em 5 dias")).toBeVisible();

    // So does the matéria it belongs to.
    await page.goto("/disciplinas/morfofuncional-aplicado-a-clinica-i");
    await expect(page.getByRole("link", { name: /N1.*em 5 dias/ })).toBeVisible();

    // Hiding it takes it off the class's pages but keeps it for the admin.
    const hidden = await page.request.patch(`/api/admin/provas/${id}`, {
      data: { visibility: "oculto" },
    });
    expect(hidden.ok()).toBe(true);
    await page.goto("/calendario");
    await expect(page.getByText("Nenhuma data cadastrada ainda")).toBeVisible();

    const removed = await page.request.delete(`/api/admin/provas/${id}`);
    expect(removed.ok()).toBe(true);
  });

  test("a past date moves to the bottom instead of disappearing", async ({ page }) => {
    await page.context().clearCookies();
    await loginAdmin(page);

    const created = await page.request.post("/api/admin/provas", {
      data: { disciplineId: "mac-1", kind: "N1", date: inDays(-3), content: [], examIds: [] },
    });
    const { id } = (await created.json()) as { id: string };

    await page.goto("/calendario");
    await expect(page.getByRole("heading", { name: "Já passaram" })).toBeVisible();
    await expect(page.getByText("há 3 dias")).toHaveCount(0); // past cards drop the countdown

    // A past exam must not take over the home page.
    await page.goto("/");
    await expect(page.getByText("Próxima prova")).toHaveCount(0);

    await page.request.delete(`/api/admin/provas/${id}`);
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
