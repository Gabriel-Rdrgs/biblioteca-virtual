import { expect, test, type Page } from "@playwright/test";
import { ligadoAoR2, MOTIVO } from "./catalogo-guard";

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

/** A data que o plano de ensino marca, e para a qual o teste devolve. */
const DATA_DA_N2_DE_MAC = "2026-12-01";

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
  /* Não roda contra o catálogo de produção — ver catalogo-guard.ts. */
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    test.skip(await ligadoAoR2(page), MOTIVO);
  });

  test("carries the dates from the teaching plans, with their source", async ({ page }) => {
    await loginClass(page);
    await page.goto("/calendario");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Calendário");

    // A date the plans state, and the page says where it came from.
    await expect(
      page.getByText("Plano de ensino de MAC I, cronograma, p. 10").first(),
    ).toBeVisible();
    await expect(page.getByText("N2 — prova teórica").first()).toBeVisible();

    // The plans all warn their schedule may move, and so does the page.
    await expect(page.getByText(/cronograma pode sofrer ajustes/i)).toBeVisible();

    // O que já passou continua guardado, atrás de um toque.
    const passado = page.getByRole("button", { name: /mostrar o que já passou/i });
    await expect(passado).toBeVisible();
    await passado.click();
    await expect(
      page.getByText("Plano de ensino de MAC I, cronograma, p. 9").first(),
    ).toBeVisible();
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
    await expect(page.getByText("em 4 dias").first()).toBeVisible();
    await expect(
      page.getByText("Plano de ensino de MAC I, cronograma, p. 10").first(),
    ).toBeVisible();

    /*
      E devolve a data do plano. Este teste escreve no catálogo de verdade,
      que é o mesmo que a turma vê: sem isto, a N2 de MAC I ficava marcada
      para daqui a quatro dias até alguém reparar — e alguém reparou.
    */
    const restored = await page.request.patch("/api/admin/provas/mac-1-n2-teorica", {
      data: { visibility: "visivel", date: DATA_DA_N2_DE_MAC },
    });
    expect(restored.ok()).toBe(true);
    // O cartão mostra só o dia; o .ics mostra a data inteira.
    const ics = await page.request.get("/api/calendario?evento=mac-1-n2-teorica");
    expect(await ics.text()).toContain(
      `DTSTART;VALUE=DATE:${DATA_DA_N2_DE_MAC.replaceAll("-", "")}`,
    );
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
    // Qualquer seção serve: a lista deixou de ter tira compacta.
    const card = page.locator("section li").filter({ hasText: "Prova surpresa" }).first();
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

  // A N1 de IC pode já ter passado; o aviso precisa sobreviver a isso.
  const passado = page.getByRole("button", { name: /mostrar o que já passou/i });
  if (await passado.count()) await passado.click();

  const card = page
    .locator("section li")
    .filter({ hasText: "IC I" })
    .filter({ hasText: /data alterada/i })
    .first();
  await expect(card.getByText(/data alterada/i)).toBeVisible();
  await expect(card.getByText(/O plano previa 8 de outubro/)).toBeVisible();
  await expect(card.getByText(/informado pela turma/i)).toBeVisible();
});

test("an N2 that is cumulative says so, with the page that says it", async ({ page }) => {
  if (!CLASS) return;
  await loginClass(page);
  await page.goto("/calendario");

  const card = page
    .locator("section li")
    .filter({ hasText: "N2 — avaliação somativa tutorial" })
    .first();
  await expect(card.getByText(/problemas 1 a 4, cobrados na N1/i)).toBeVisible();
  await expect(
    card.getByText(/acumulativo conforme o plano de ensino de AES 2, p\. 8/i),
  ).toBeVisible();
});

test("o calendário tem vistas, filtro e exportação", async ({ page }) => {
  if (!CLASS) return;
  await loginClass(page);
  await page.goto("/calendario");

  // A tira responde "o que tenho esta semana" sem procurar.
  await expect(page.getByRole("heading", { name: "Próximos 7 dias" })).toBeVisible();

  // A grade do mês é a única vista que mostra aglomeração.
  await page.getByRole("button", { name: "Mês" }).click();
  const grade = page.getByRole("table");
  await expect(grade).toBeVisible();
  await expect(grade.getByRole("columnheader", { name: "qui" })).toBeVisible();

  // Filtrar por matéria some com o resto.
  await page.getByRole("button", { name: /^IC I$/ }).click();
  await page.getByRole("button", { name: "Lista" }).click();
  const lista = page.locator("section li");
  await expect(lista.first()).toContainText("IC I");
  await expect(lista.filter({ hasText: "AES 2" })).toHaveCount(0);

  // E voltar para todas desfaz o filtro.
  await page.getByRole("button", { name: "Todas" }).click();
  await expect(lista.filter({ hasText: "AES 2" }).first()).toBeVisible();
});

test("exporta um .ics que um app de calendário entende", async ({ page }) => {
  if (!CLASS) return;
  await loginClass(page);
  const resposta = await page.request.get("/api/calendario");
  expect(resposta.status()).toBe(200);
  expect(resposta.headers()["content-type"]).toContain("text/calendar");

  const texto = await resposta.text();
  expect(texto.startsWith("BEGIN:VCALENDAR")).toBe(true);
  expect(texto).toContain("BEGIN:VEVENT");
  expect(texto).toContain("DTSTART;VALUE=DATE:");
});

test("a aula com resumo aparece no calendário, junto das provas", async ({ page }) => {
  if (!CLASS) return;
  await loginClass(page);
  await page.goto("/calendario");
  await page.getByRole("button", { name: /mostrar o que já passou/i }).click();

  // "Aula 01" também aparece no botão "Resumo da aula 01" do cartão da N1:
  // o título do encontro é o que identifica a aula sem ambiguidade.
  const aula = page
    .locator("li")
    .filter({ hasText: "Microscopia + Referenciais anatômicos" })
    .first();
  await expect(aula).toBeVisible();
  await expect(aula.getByRole("link", { name: /abrir o resumo/i })).toBeVisible();
});

test("a busca acha uma data sem rolar o semestre", async ({ page }) => {
  if (!CLASS) return;
  await loginClass(page);
  await page.goto("/calendario");

  await page.getByLabel("Buscar no calendário").fill("tutorial");
  const lista = page.locator("section li");
  await expect(lista.first()).toContainText("tutorial");
  // Sem acento e sem maiúscula dá no mesmo.
  await page.getByLabel("Buscar no calendário").fill("AVALIACAO SOMATIVA");
  await expect(lista.first()).toContainText("somativa");

  await page.getByRole("button", { name: "Limpar a busca" }).click();
  await expect(page.getByLabel("Buscar no calendário")).toHaveValue("");
});

test("a grade do mês anda pelo teclado", async ({ page }) => {
  if (!CLASS) return;
  await loginClass(page);
  await page.goto("/calendario");
  await page.getByRole("button", { name: "Mês" }).click();

  // Um só dia é tabulável; as setas levam aos outros.
  const tabulaveis = page.locator('table button[tabindex="0"]');
  await expect(tabulaveis).toHaveCount(1);

  await tabulaveis.first().focus();
  const antes = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  await page.keyboard.press("ArrowRight");
  const depois = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  expect(depois).not.toBe(antes);

  // Uma semana inteira para baixo e de volta ao mesmo dia.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe(
    depois,
  );
});

test("dá para levar uma prova só para a agenda", async ({ page }) => {
  if (!CLASS) return;
  await loginClass(page);
  // Uma data que nenhum outro teste move: a de MAC I é remarcada no teste
  // do painel, e um teste não deve depender do estado deixado por outro.
  const resposta = await page.request.get("/api/calendario?evento=aes-2-n3");
  expect(resposta.status()).toBe(200);

  const texto = await resposta.text();
  // Um evento, e é o pedido.
  expect(texto.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  expect(texto).toContain("aes-2-n3@atlas");
  expect(texto).toContain("DTSTART;VALUE=DATE:20261210");

  const inexistente = await page.request.get("/api/calendario?evento=nao-existe");
  expect(inexistente.status()).toBe(404);
});
