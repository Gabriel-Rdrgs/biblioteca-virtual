import { expect, test, type Page } from "@playwright/test";

/**
 * As notas, de ponta a ponta.
 *
 * O que importa aqui é a conta chegar inteira à tela, e chegar dos três
 * lugares por onde se anota: a página de notas, a página da matéria e o
 * cartão da prova no calendário. É sempre a mesma folha dentro do mesmo
 * pop-up — e o que se digita nela precisa aparecer atrás dela.
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

/** A lista de matérias do painel — fora dela há `li` de navegação. */
const painel = (page: Page) => page.getByRole("list", { name: "Notas por matéria" });

/** O pop-up de uma matéria, aberto de onde o botão dela estiver. */
async function abrirNotas(page: Page, materia: RegExp) {
  await page.getByRole("button", { name: materia }).first().click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  return dialogo;
}

test("anotar as partes forma a bimestral e diz quanto falta", async ({ page }) => {
  if (!process.env.ATLAS_SENHA_TURMA) return;
  await page.goto("/notas");

  const dialogo = await abrirNotas(page, /notas — Morfofuncional/i);

  // MAC I: formativa 1,0 + teórica 6,0 + teórico-prática 3,0.
  await dialogo.locator("#nota-mac-1-n1-formativa").fill("1");
  await dialogo.locator("#nota-mac-1-n1-teorica").fill("4");
  await dialogo.locator("#nota-mac-1-n1-pratica").fill("2");

  await expect(dialogo.getByText("7,0 / 10")).toBeVisible();
  await expect(dialogo.getByText("Precisa de 5,0 na N2 para fechar 6,0.")).toBeVisible();

  // Fechando a N2 em 5,0, a média parcial dá exatamente 6,0: aprovado.
  await dialogo.locator("#nota-mac-1-n2-formativa").fill("1");
  await dialogo.locator("#nota-mac-1-n2-teorica").fill("3");
  await dialogo.locator("#nota-mac-1-n2-pratica").fill("1");
  await expect(dialogo.getByText("aprovado, sem ARA")).toBeVisible();

  // E o painel atrás do pop-up já sabe, sem recarregar nada.
  await dialogo.getByRole("button", { name: /^pronto$/i }).click();
  const linha = painel(page).getByRole("listitem").filter({ hasText: "Morfofuncional" });
  await expect(linha.getByText("aprovado", { exact: true })).toBeVisible();
  await expect(linha).toContainText("Média parcial 6,0 — aprovado, sem ARA.");
});

test("a nota sobrevive a recarregar a página", async ({ page }) => {
  if (!process.env.ATLAS_SENHA_TURMA) return;
  await page.goto("/notas");

  const dialogo = await abrirNotas(page, /notas — Habilidades/i);
  await dialogo.locator("#nota-ha-1-n1-osce").fill("7,5");
  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();

  await page.reload();
  const reaberto = await abrirNotas(page, /notas — Habilidades/i);
  await expect(reaberto.locator("#nota-ha-1-n1-osce")).toHaveValue("7,5");

  // E dá para apagar as notas de uma matéria só, de dentro da folha dela.
  await reaberto.getByRole("button", { name: /apagar as notas de/i }).click();
  await expect(reaberto.locator("#nota-ha-1-n1-osce")).toHaveValue("");
});

test("a ARA entra na conta quando a parcial não alcança", async ({ page }) => {
  if (!process.env.ATLAS_SENHA_TURMA) return;
  await page.goto("/notas");

  const dialogo = await abrirNotas(page, /notas — AES 2/i);

  // AES 2: formativa 2,0 + somativa 8,0, nas duas bimestrais.
  for (const [campo, nota] of [
    ["#nota-aes-2-n1-formativa", "1"],
    ["#nota-aes-2-n1-somativa", "4"],
    ["#nota-aes-2-n2-formativa", "1"],
    ["#nota-aes-2-n2-somativa", "4"],
  ] as const) {
    await dialogo.locator(campo).fill(nota);
  }
  await expect(dialogo.getByText("vai para a ARA", { exact: true })).toBeVisible();
  await expect(dialogo.getByText("Precisa de 6,5 na ARA.")).toBeVisible();

  // Média parcial 5,0; com 6,5 na ARA a final dá 5,75 — que aprova.
  await dialogo.locator("#ara-aes-2").fill("6,5");
  await expect(dialogo.getByText("aprovado na ARA", { exact: true })).toBeVisible();
});

test("recusa uma nota fora da escala da parte", async ({ page }) => {
  if (!process.env.ATLAS_SENHA_TURMA) return;
  await page.goto("/notas");
  const dialogo = await abrirNotas(page, /notas — Morfofuncional/i);

  // A prova teórica de MAC I vale 6,0: 8 não cabe nela.
  const campo = dialogo.locator("#nota-mac-1-n1-teorica");
  await campo.fill("8");
  await expect(campo).toHaveAttribute("aria-invalid", "true");

  await campo.fill("5,5");
  await expect(campo).toHaveAttribute("aria-invalid", "false");
});

test("a nota se anota no cartão da prova, no calendário", async ({ page }) => {
  if (!process.env.ATLAS_SENHA_TURMA) return;
  await page.goto("/calendario");
  await page.getByRole("button", { name: /mostrar o que já passou/i }).click();

  const cartao = page
    .locator("section li")
    .filter({ hasText: "N1 — prova teórica" })
    .filter({ hasText: "MAC I" })
    .first();

  await expect(cartao.getByText(/sua nota em prova teórica/i)).toBeVisible();
  await cartao.getByRole("button", { name: /nota — Morfofuncional/i }).click();

  const dialogo = page.getByRole("dialog");
  await dialogo.locator("#nota-mac-1-n1-teorica").fill("5");
  await dialogo.getByRole("button", { name: /^pronto$/i }).click();

  // O cartão mostra a nota sem recarregar: as duas telas leem o mesmo lugar.
  await expect(cartao.getByText("5,0 / 6,0")).toBeVisible();
});

test("o calendário tem uma aba de notas, e ela respeita o filtro de matéria", async ({ page }) => {
  if (!process.env.ATLAS_SENHA_TURMA) return;
  await page.goto("/calendario");

  await page.getByRole("button", { name: "Notas", exact: true }).click();
  await expect(painel(page).getByRole("listitem")).toHaveCount(7);

  // Filtrando por uma matéria, o painel mostra só ela.
  await page.getByRole("button", { name: /^MAC I$/ }).click();
  const linhas = painel(page).getByRole("listitem");
  await expect(linhas).toHaveCount(1);
  await expect(linhas.first()).toContainText("Morfofuncional");
});

test("a matéria mostra as próprias notas e abre a mesma folha", async ({ page }) => {
  if (!process.env.ATLAS_SENHA_TURMA) return;
  await page.goto("/disciplinas/morfofuncional-aplicado-a-clinica-i");

  const secao = page.locator('section[aria-labelledby="minhas-notas"]');
  await expect(secao.getByRole("heading", { name: "Minhas notas" })).toBeVisible();

  const dialogo = await abrirNotas(page, /notas — Morfofuncional/i);
  await dialogo.locator("#nota-mac-1-n1-formativa").fill("1");
  await dialogo.locator("#nota-mac-1-n1-teorica").fill("6");
  await dialogo.locator("#nota-mac-1-n1-pratica").fill("3");
  await dialogo.getByRole("button", { name: /^pronto$/i }).click();

  await expect(secao.getByText("10,0")).toBeVisible();
  await expect(secao.getByText(/precisa de 2,0 na N2/i)).toBeVisible();
});
