// Syncs storage/*.pdf to the R2 bucket. Run with:
//   npm run upload:storage            (tudo)
//   npm run upload:storage resumos    (só uma pasta)
// São quatro pastas, e cada uma vira um prefixo no bucket, igual ao que
// objectKey() monta em src/lib/storage.ts: livros, planos, simulados e
// resumos. Enviar só os livros era um jeito silencioso de publicar um
// resumo que o deploy depois não acha.
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

const PASTAS = ["livros", "planos", "simulados", "resumos"];
const pedidas = process.argv.slice(2);
const desconhecida = pedidas.find((nome) => !PASTAS.includes(nome));
if (desconhecida) {
  console.error(`Pasta desconhecida: ${desconhecida}. Use uma de: ${PASTAS.join(", ")}.`);
  process.exit(1);
}

/**
 * O que vai para o bucket, e com que tipo.
 *
 * Os cadernos de simulado levam figuras junto — jpg, png e svg — e mandar
 * só os PDFs deixava as questões sem imagem no deploy.
 */
const TIPOS = {
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};
const tipoDe = (name) => TIPOS[name.slice(name.lastIndexOf(".")).toLowerCase()];

const mb = (bytes) => (bytes / 1048576).toFixed(1).padStart(7) + " MB";

/** Os arquivos de cada pasta, com a chave que terão no bucket. */
const alvos = [];
for (const pasta of pedidas.length > 0 ? pedidas : PASTAS) {
  const dir = join(process.cwd(), "storage", pasta);
  let nomes = [];
  try {
    nomes = (await readdir(dir)).filter((name) => Boolean(tipoDe(name))).sort();
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    continue;
  }
  for (const name of nomes) alvos.push({ pasta, name, path: join(dir, name) });
}

let sent = 0;
let skipped = 0;
let pastaAtual = null;

for (const alvo of alvos) {
  const { pasta, name, path } = alvo;
  if (pasta !== pastaAtual) {
    console.log(`
${pasta}/`);
    pastaAtual = pasta;
  }
  const { size } = await stat(path);
  const Key = `${pasta}/${name}`;

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
      ContentType: tipoDe(name),
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
