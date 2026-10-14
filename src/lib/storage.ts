import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Where the class PDFs live.
 *
 * - `local`: storage/livros on this machine, streamed by the file route.
 *   What `npm run dev` and a self-hosted server use.
 * - `r2`: a private Cloudflare R2 bucket. The app never proxies bytes; after
 *   the session check it hands out a short-lived signed URL and the browser
 *   talks to R2 directly, ranges included. Chosen because R2 charges nothing
 *   for egress, so a class re-reading a 700 MB atlas costs nothing.
 *
 * The mode is decided by environment alone, so the same build runs in both.
 */

export type StorageMode = "local" | "r2";

const REQUIRED = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
] as const;

export function storageMode(): StorageMode {
  return REQUIRED.every((name) => Boolean(process.env[name])) ? "r2" : "local";
}

let client: S3Client | null = null;

export function r2Client(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
  return client;
}

/** Which shelf a file sits on. */
export type StorageFolder = "livros" | "planos" | "simulados" | "resumos";

/** Object key — the same relative path used under storage/ on disk. */
export function objectKey(fileName: string, folder: StorageFolder = "livros"): string {
  return `${folder}/${fileName}`;
}

function contentDisposition(kind: "inline" | "attachment", fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/**
 * A URL the browser can fetch without credentials for `expiresIn` seconds.
 * Only callable once the session has been verified — that is the whole
 * point of keeping the bucket private.
 */
export async function signedFileUrl(
  fileName: string,
  options: {
    download: boolean;
    downloadName: string;
    expiresIn?: number;
    folder?: StorageFolder;
    contentType?: string;
  },
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: objectKey(fileName, options.folder),
    ResponseContentType: options.contentType ?? "application/pdf",
    ResponseContentDisposition: contentDisposition(
      options.download ? "attachment" : "inline",
      options.downloadName,
    ),
  });
  return getSignedUrl(r2Client(), command, { expiresIn: options.expiresIn ?? 3600 });
}

/**
 * A URL the browser can PUT a PDF to directly, bypassing the app server and
 * its request-size limits. Ten minutes is enough to start a large upload;
 * once started, the transfer keeps going.
 */
export async function signedUploadUrl(
  fileName: string,
  sizeBytes: number,
  folder: StorageFolder = "livros",
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: objectKey(fileName, folder),
    ContentType: "application/pdf",
    ContentLength: sizeBytes,
  });
  return getSignedUrl(r2Client(), command, { expiresIn: 600 });
}

export async function deleteObject(
  fileName: string,
  folder: StorageFolder = "livros",
): Promise<void> {
  await r2Client().send(
    new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: objectKey(fileName, folder) }),
  );
}
