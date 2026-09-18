// Extracts text from the UNIEURO teaching plans using pdfjs-dist, which
// resolves each font's ToUnicode CMap — necessary because several plans
// embed subsetted fonts with scrambled custom encodings.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const pdfjsPath = require.resolve("pdfjs-dist/legacy/build/pdf.mjs");
const pdfjs = await import(pathToFileURL(pdfjsPath).href);

const DOWNLOADS = "C:\\Users\\Soares\\Downloads";
const OUT_DIR = fileURLToPath(new URL("./out/", import.meta.url));

const PLANS = {
  mac1: "MAC I - plano de ensino.pdf",
  iescg1: "PLANO_DE_ENSINO_IESCG_I_2026-2.pdf",
  hm1: "PLANO DE ENSINO HM1 - 2.2026 REVISADO (11.0) v2 (1).pdf",
  ha1: "Plano de Ensino HA I - 2026.2.pdf",
  ic1: "PLANO_DE_ENSINO_IC1_02_2026_BRUNASOUSA (2).pdf",
  aes1: "Plano de ensino AES01 2 2026 publicar.pdf",
  aes2: "AES 02 - PLANO DE ENSINO_2\u00ba2026.pdf",
};

/**
 * Rebuilds reading order from positioned text items: a change in the
 * vertical transform component starts a new line, and a horizontal gap
 * wider than a space becomes one.
 */
function itemsToText(items) {
  const lines = [];
  let current = null;

  for (const item of items) {
    if (typeof item.str !== "string") continue;
    const y = Math.round(item.transform[5] * 10) / 10;
    const x = item.transform[4];

    if (!current || Math.abs(current.y - y) > 2) {
      current = { y, x: null, parts: [] };
      lines.push(current);
    }

    if (current.x !== null && x - current.x > 3) current.parts.push(" ");
    current.parts.push(item.str);
    current.x = x + (item.width ?? 0);

    if (item.hasEOL) current = null;
  }

  return lines
    .map((l) =>
      l.parts
        .join("")
        .replace(/[ \t]+/g, " ")
        .trim(),
    )
    .join("\n");
}

await mkdir(OUT_DIR, { recursive: true });

for (const [key, file] of Object.entries(PLANS)) {
  const path = join(DOWNLOADS, file);
  try {
    const data = new Uint8Array(await readFile(path));
    const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

    const pages = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      pages.push(`===== PAGE ${p} =====\n${itemsToText(content.items)}`);
    }

    const text = pages.join("\n\n").replace(/\n{3,}/g, "\n\n");
    await writeFile(join(OUT_DIR, `${key}.txt`), text, "utf8");
    console.log(
      `OK   ${key.padEnd(7)} ${doc.numPages} pages, ${text.length} chars  <- ${basename(file)}`,
    );
  } catch (err) {
    console.log(`FAIL ${key.padEnd(7)} ${err.message}`);
  }
}
