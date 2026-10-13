import { z } from "zod";

/**
 * Validation for everything the admin area accepts. Inputs are trimmed,
 * length-limited and, for enums, restricted to the catalogue's own values —
 * the server trusts nothing the browser sends.
 */

export const MAX_FILE_BYTES = 1024 * 1024 * 1024; // 1 GB

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
  folder: z.enum(["livros", "planos"]).default("livros"),
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
  // Existence is checked against the live catalogue when the book is created.
  disciplineIds: z.array(trimmed(80).min(1)).min(1, "Escolha ao menos uma matéria."),
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

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor em hexadecimal, ex.: #0f5563.");

export const syllabusUnitSchema = z.object({
  title: trimmed(120).min(2),
  items: z.array(trimmed(200).min(2)).max(30),
});

export const uploadedPlanSchema = uploadedFileSchema.extend({
  originalName: trimmed(300).min(1),
});

export const disciplineSchema = z.object({
  name: trimmed(120).min(3, "Nome muito curto."),
  shortName: trimmed(20).min(2, "Sigla muito curta."),
  code: optionalText(30),
  period: z.number().int().min(1, "Período de 1 a 12.").max(12, "Período de 1 a 12."),
  semester: z
    .string()
    .trim()
    .regex(/^\d{4}\.[12]$/, "Semestre no formato 2027.1."),
  workload: optionalText(20),
  weeklyWorkload: optionalText(20),
  description: trimmed(2000).min(20, "Ementa muito curta (mínimo 20 caracteres)."),
  syllabus: z.array(syllabusUnitSchema).max(20).default([]),
  teachers: z.array(trimmed(120).min(2)).max(20).default([]),
  notes: z.array(trimmed(300).min(2)).max(10).default([]),
  color: hexColor,
  colorSoft: hexColor,
  motif: z.enum([
    "anatomia",
    "histologia",
    "bioquimica",
    "semiologia",
    "humanidades",
    "saude-coletiva",
    "metodologia",
  ]),
  plan: uploadedPlanSchema.optional(),
});

export type DisciplineInput = z.infer<typeof disciplineSchema>;

export const disciplinePatchSchema = disciplineSchema.partial().extend({
  plan: uploadedPlanSchema.nullable().optional(),
});

export const currentPeriodSchema = z.object({
  currentPeriod: z.number().int().min(1).max(12),
});

export const assessmentSchema = z.object({
  disciplineId: trimmed(80).min(1, "Escolha a matéria."),
  kind: z.enum(["N1", "N2", "N3", "final", "substitutiva", "treino"]).default("N1"),
  title: optionalText(80),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato AAAA-MM-DD."),
  time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário no formato HH:MM.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  room: optionalText(60),
  weight: optionalText(20),
  content: z.array(trimmed(200).min(2)).max(30).default([]),
  examIds: z.array(trimmed(80).min(1)).max(10).default([]),
  note: optionalText(400),
});

export type AssessmentInput = z.infer<typeof assessmentSchema>;

export const assessmentPatchSchema = assessmentSchema.partial();
