import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { readManifest, resetManifestCache, updateManifest } from "@/lib/catalog-store";

/**
 * The manifest is one file written by every admin action, so concurrent
 * updates are the realistic case, not an edge one.
 */

const LOCAL_PATH = resolve(process.cwd(), "storage", "catalogo.json");

afterEach(async () => {
  await rm(LOCAL_PATH, { force: true });
  resetManifestCache();
});

describe("escrita concorrente do manifesto", () => {
  it("keeps every change when updates land at the same time", async () => {
    const at = new Date().toISOString();
    await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        updateManifest((current) => ({
          ...current,
          log: [...current.log, { at, action: "visibilidade" as const, bookId: `livro-${i}` }],
        })),
      ),
    );

    resetManifestCache();
    const manifest = await readManifest();
    // Without a queue the later writes would overwrite the earlier reads.
    expect(manifest.log).toHaveLength(12);
    expect(new Set(manifest.log.map((entry) => entry.bookId)).size).toBe(12);
  });

  it("a failing update does not stall the ones behind it", async () => {
    const boom = updateManifest(() => {
      throw new Error("falha proposital");
    });
    await expect(boom).rejects.toThrow("falha proposital");

    await updateManifest((current) => ({
      ...current,
      settings: { ...current.settings, currentPeriod: 3 },
    }));

    resetManifestCache();
    expect((await readManifest()).settings?.currentPeriod).toBe(3);
  });

  it("leaves no temporary files behind", async () => {
    await updateManifest((current) => ({ ...current, settings: { currentPeriod: 2 } }));
    const { readdir } = await import("node:fs/promises");
    const entries = await readdir(resolve(process.cwd(), "storage"));
    expect(entries.filter((name) => name.includes(".tmp"))).toEqual([]);
  });
});
