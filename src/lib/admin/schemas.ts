import { z } from "zod";
import { disciplines } from "@/lib/data/disciplines";

/**
 * Validation for everything the admin area accepts. Inputs are trimmed,
 * length-limited and, for enums, restricted to the catalogue's own values —
 * the server trusts nothing the browser sends.
 */

export const MAX_FILE_BYTES = 1024 * 1024 * 1024; // 1 GB
const disciplineIds = disciplines.map((d) => d.id) as [string, ...string[]];

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/** A PDF the browser has already put in storage. */
export const uploadedFileSchema = z.object({
  fileName: z.string().regex(/^[a-z0-9][a-z0-9-]{2,120}\.pdf$/, "Nome de arquivo inválido."),
  sizeBytes: z.number().int().positive().max(MAX_FILE_BYTES),
});

export const fileMetaSchema = z.object({
  origin: trimmed(200).min(5, "Informe a origem do arquivo (mínimo 5 caracteres)."),
  authorization: trimmed(300).min(5, "Informe a autorização de uso (mínimo 5 caracteres)."),
  note: optionalText(300),
});

export const uploadRequestSchema = z.object({
  /** The original file name, only used to derive a safe one. */
  name: trimmed(300).min(1),
  sizeBytes: z.number().int().positive().max(MAX_FILE_BYTES),
});

export const newBookSchema = z.object({
  title: trimmed(200).min(3, "Título muito curto."),
  subtitle: optionalText(300),
  authors: z.array(trimmed(120).min(2)).min(1, "Informe ao menos um autor.").max(12),
  publisher: optionalText(120),
  publicationYear: z.number().int().min(1800).max(2100).optional(),
  edition: optionalText(40),
  isbn: optionalText(30),
  topics: z.array(trimmed(60).min(2)).max(12).default([]),
  disciplineIds: z.array(z.enum(disciplineIds)).min(1, "Escolha ao menos uma disciplina."),
  bibliographyType: z
    .enum(["basica", "basica_virtual", "complementar", "outras_referencias", "acervo_da_turma"])
    .default("acervo_da_turma"),
  coverMotif: z
    .enum([
      "anatomia",
      "histologia",
      "bioquimica",
      "semiologia",
      "humanidades",
      "saude-coletiva",
      "metodologia",
    ])
    .optional(),
  file: uploadedFileSchema,
  fileMeta: fileMetaSchema,
  /** Set after the admin has seen and accepted a duplicate warning. */
  confirmDuplicate: z.boolean().default(false),
});

export type NewBookInput = z.infer<typeof newBookSchema>;

export const attachFileSchema = z.object({
  file: uploadedFileSchema,
  fileMeta: fileMetaSchema,
});

export const visibilitySchema = z.object({
  visibility: z.enum(["visivel", "oculto"]),
});
