import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import "@testing-library/jest-dom/vitest";

/**
 * O jsdom conhece o elemento `<dialog>`, mas não implementa o comportamento
 * modal dele: `showModal` e `close` simplesmente não existem. Isto repõe o
 * mínimo que os testes precisam — abrir, fechar e avisar que fechou.
 *
 * O trancamento de foco e o Esc continuam de fora, porque são do navegador
 * de verdade; é o que o Playwright verifica, não o jsdom.
 */
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(
    this: HTMLDialogElement,
    returnValue?: string,
  ) {
    this.open = false;
    if (returnValue !== undefined) this.returnValue = returnValue;
    this.dispatchEvent(new Event("close"));
  };
}

/**
 * Os testes escrevem no manifesto do catálogo — e um deles o apaga ao
 * terminar. Sem isto, apagavam o `storage/catalogo.json` da turma: os
 * livros publicados pelo admin, as datas corrigidas e o que mais estivesse
 * lá. Cada execução ganha a sua pasta, descartável.
 */
process.env.ATLAS_STORAGE_DIR = mkdtempSync(join(tmpdir(), "atlas-testes-"));
