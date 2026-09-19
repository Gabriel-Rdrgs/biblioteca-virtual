import { afterEach, describe, expect, it, vi } from "vitest";
import { objectKey, signedFileUrl, storageMode } from "@/lib/storage";

const r2Env = {
  R2_ACCOUNT_ID: "abc123",
  R2_ACCESS_KEY_ID: "key",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_BUCKET: "atlas-livros",
};

afterEach(() => vi.unstubAllEnvs());

describe("storage mode", () => {
  it("serves from disk unless every R2 variable is present", () => {
    for (const name of Object.keys(r2Env)) vi.stubEnv(name, "");
    expect(storageMode()).toBe("local");

    for (const [name, value] of Object.entries(r2Env)) vi.stubEnv(name, value);
    vi.stubEnv("R2_BUCKET", "");
    expect(storageMode()).toBe("local");
  });

  it("switches to R2 when configured", () => {
    for (const [name, value] of Object.entries(r2Env)) vi.stubEnv(name, value);
    expect(storageMode()).toBe("r2");
  });
});

describe("signed URLs", () => {
  it("point at the private bucket, expire, and force a PDF download name", async () => {
    for (const [name, value] of Object.entries(r2Env)) vi.stubEnv(name, value);

    const url = new URL(
      await signedFileUrl("moore-anatomia-clinica.pdf", {
        download: true,
        downloadName: "moore-anatomia-clinica.pdf",
        expiresIn: 600,
      }),
    );

    // Virtual-hosted style: bucket name in the host, key in the path.
    expect(url.hostname).toBe("atlas-livros.abc123.r2.cloudflarestorage.com");
    expect(url.pathname).toBe(`/${objectKey("moore-anatomia-clinica.pdf")}`);
    expect(url.searchParams.get("X-Amz-Expires")).toBe("600");
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    expect(url.searchParams.get("response-content-type")).toBe("application/pdf");
    expect(url.searchParams.get("response-content-disposition")).toContain("attachment");
  });
});
