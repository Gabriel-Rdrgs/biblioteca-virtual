import type { Page } from "@playwright/test";

/**
 * Protege o catálogo da turma dos testes que escrevem nele.
 *
 * O painel do admin grava num manifesto só. Quando o servidor está ligado
 * ao Cloudflare R2, esse manifesto é o de produção — o mesmo que a turma
 * abre no celular. E foi exatamente assim que a N2 de MAC I ficou marcada
 * para "daqui a quatro dias": um teste moveu a data para provar que dava
 * para corrigi-la, e a correção ficou.
 *
 * A configuração do Playwright zera as variáveis do R2 no servidor que ela
 * mesma levanta, mas ela reaproveita um servidor que já esteja de pé — e um
 * `npm run dev` comum lê o `.env.local` e fala com o R2. Daí esta checagem
 * em tempo de execução: pergunta ao próprio painel em que modo ele está.
 *
 * Precisa da sessão de admin já aberta na página.
 */
export async function ligadoAoR2(page: Page): Promise<boolean> {
  const painel = await page.request.get("/admin");
  return (await painel.text()).includes("Cloudflare R2");
}

export const MOTIVO = "o servidor está ligado ao R2: estes testes escreveriam no catálogo da turma";
