// Syncs storage/livros/*.pdf to the R2 bucket. Run with:
//   npm run upload:storage
// Objects already in the bucket with the same size are skipped, so re-runs
// only send what changed. Requires the R2_* variables in .env.local.
import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Faltam variáveis em .env.local: ${missing.join(", ")}`);
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const dir = join(process.cwd(), "storage", "livros");
const files = (await readdir(dir)).filter((name) => name.toLowerCase().endsWith(".pdf")).sort();
const mb = (bytes) => (bytes / 1048576).toFixed(1).padStart(7) + " MB";

let sent = 0;
let skipped = 0;

for (const name of files) {
  const path = join(dir, name);
  const { size } = await stat(path);
  const Key = `livros/${name}`;

  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key }));
    if (head.ContentLength === size) {
      console.log(`  já enviado  ${mb(size)}  ${name}`);
      skipped++;
      continue;
    }
  } catch (error) {
    if (error?.$metadata?.httpStatusCode !== 404) throw error;
  }

  const started = Date.now();
  process.stdout.write(`  enviando    ${mb(size)}  ${name} …`);
  const upload = new Upload({
    client,
    params: {
      Bucket: process.env.R2_BUCKET,
      Key,
      Body: createReadStream(path),
      ContentType: "application/pdf",
    },
    partSize: 16 * 1024 * 1024,
    queueSize: 4,
  });
  let lastPct = -1;
  upload.on("httpUploadProgress", (p) => {
    const pct = Math.floor(((p.loaded ?? 0) / size) * 100);
    if (pct !== lastPct && pct % 10 === 0) {
      process.stdout.write(` ${pct}%`);
      lastPct = pct;
    }
  });
  await upload.done();
  console.log(`  ok (${((Date.now() - started) / 1000).toFixed(0)}s)`);
  sent++;
}

console.log(`\n${sent} enviado(s), ${skipped} já estavam no bucket.`);
