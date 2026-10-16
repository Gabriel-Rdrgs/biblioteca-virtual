import type { Situation } from "@/lib/domain/grading";

/** Como cada situação se chama e se colore, em toda tela que a mostra. */
export const situacoes: Record<
  Situation,
  { readonly texto: string; readonly tom: "neutro" | "sucesso" | "acento" | "perigo" }
> = {
  incompleto: { texto: "em andamento", tom: "neutro" },
  aprovado: { texto: "aprovado", tom: "sucesso" },
  ara: { texto: "vai para a ARA", tom: "acento" },
  aprovado_na_ara: { texto: "aprovado na ARA", tom: "sucesso" },
  reprovado: { texto: "reprovado", tom: "perigo" },
};
