import { expect, test } from "@playwright/test";

/**
 * As notas, de ponta a ponta.
 *
 * O que importa aqui é a conta chegar inteira à tela: anotar as partes de
 * uma bimestral, ver a nota que elas formam, e a frase que responde o que
 * motivou tudo isto — quanto falta na outra.
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

test("anotar as partes forma a bimestral e diz quanto falta", async ({ page }) => {
  if (!process.env.ATLAS_SENHA_TURMA) return;
  await page.goto("/notas");

  const mac = page.locator('section[aria-labelledby="notas-mac-1"]');

  // MAC I: formativa 1,0 + teórica 6,0 + teórico-prática 3,0.
  await page.locator("#nota-mac-1-n1-formativa").fill("1");
  await page.locator("#nota-mac-1-n1-teorica").fill("4");
  await page.locator("#nota-mac-1-n1-pratica").fill("2");

  await expect(mac.getByText("7,0 / 10").first()).toBeVisible();
  await expect(page.getByText("Precisa de 5,0 na N2 para fechar 6,0.")).toBeVisible();

  // Fechando a N2 em 5,0, a média parcial dá exatamente 6,0: aprovado.
  await page.locator("#nota-mac-1-n2-formativa").fill("1");
  await page.locator("#nota-mac-1-n2-teorica").fill("3");
  await page.locator("#nota-mac-1-n2-pratica").fill("1");

  await expect(mac.getByText("aprovado").first()).toBeVisible();
});

test("a nota sobrevive a recarregar a página", async ({ page }) => {
  if (!process.env.ATLAS_SENHA_TURMA) return;
  await page.goto("/notas");
  await page.locator("#nota-ha-1-n1-osce").fill("7,5");
  await page.waitForTimeout(200);

  await page.reload();
  await expect(page.locator("#nota-ha-1-n1-osce")).toHaveValue("7,5");

  // E dá para apagar tudo deste aparelho.
  await page.getByRole("button", { name: /apagar as notas/i }).click();
  await expect(page.locator("#nota-ha-1-n1-osce")).toHaveValue("");
});

test("a ARA entra na conta quando a parcial não alcança", async ({ page }) => {
  if (!process.env.ATLAS_SENHA_TURMA) return;
  await page.goto("/notas");

  // AES 2: formativa 2,0 + somativa 8,0, nas duas bimestrais.
  for (const [campo, nota] of [
    ["#nota-aes-2-n1-formativa", "1"],
    ["#nota-aes-2-n1-somativa", "4"],
    ["#nota-aes-2-n2-formativa", "1"],
    ["#nota-aes-2-n2-somativa", "4"],
  ] as const) {
    await page.locator(campo).fill(nota);
  }

  const aes = page.locator('section[aria-labelledby="notas-aes-2"]');
  await expect(aes.getByText("vai para a ARA").first()).toBeVisible();

  // Média parcial 5,0; com 6,5 na ARA a final dá 5,75 — que aprova.
  await page.locator("#ara-aes-2").fill("6,5");
  await expect(aes.getByText("aprovado na ARA").first()).toBeVisible();
});

test("a nota se anota também no cartão da prova, no calendário", async ({ page }) => {
  if (!process.env.ATLAS_SENHA_TURMA) return;
  await page.goto("/calendario");
  await page.getByRole("button", { name: /mostrar o que já passou/i }).click();

  const cartao = page
    .locator("section li")
    .filter({ hasText: "N1 — prova teórica" })
    .filter({ hasText: "MAC I" })
    .first();

  const campo = cartao.getByLabel(/sua nota em prova teórica/i);
  await expect(campo).toBeVisible();
  await campo.fill("5");
  await expect(cartao.getByText(/não é registro oficial/i)).toBeVisible();
});

test("recusa uma nota fora da escala da parte", async ({ page }) => {
  if (!process.env.ATLAS_SENHA_TURMA) return;
  await page.goto("/notas");

  // A prova teórica de MAC I vale 6,0: 8 não cabe nela.
  const campo = page.locator("#nota-mac-1-n1-teorica");
  await campo.fill("8");
  await expect(campo).toHaveAttribute("aria-invalid", "true");

  await campo.fill("5,5");
  await expect(campo).toHaveAttribute("aria-invalid", "false");
});
