import {
  formatGrade,
  neededInAra,
  type GradeOutcome,
  type GradeScheme,
} from "@/lib/domain/grading";

/**
 * A frase que responde "e agora?".
 *
 * É a única coisa que a tela de notas precisa dizer bem: o número já está
 * ali, o que falta é o que fazer com ele. A mesma função serve a matéria, o
 * cartão da prova, o pop-up e o painel — três redações diferentes da mesma
 * conta seriam três oportunidades de divergir.
 */
export function orientacao(scheme: GradeScheme, saida: GradeOutcome): string | null {
  if (saida.needed) {
    const falta = saida.needed.score;
    if (falta > 10) {
      return `Com esta nota, 6,0 já não sai pela ${saida.needed.term}: o caminho é a ARA.`;
    }
    if (falta <= 0) {
      return `A média já está garantida, qualquer que seja a ${saida.needed.term}.`;
    }
    return `Precisa de ${formatGrade(falta)} na ${saida.needed.term} para fechar 6,0.`;
  }

  if (saida.mp === null) return null;

  if (saida.situation === "aprovado") {
    return `Média parcial ${formatGrade(saida.mp)} — aprovado, sem ARA.`;
  }
  if (saida.situation === "ara") {
    const precisa = neededInAra(saida.mp, scheme.roundFrom);
    return precisa > 10
      ? `Média parcial ${formatGrade(saida.mp)} — nem 10,0 na ARA fecharia a média final.`
      : `Média parcial ${formatGrade(saida.mp)} — vai para a ARA, e lá precisa de ${formatGrade(precisa)}.`;
  }
  if (saida.mf !== null) {
    return saida.situation === "aprovado_na_ara"
      ? `Média final ${formatGrade(saida.mf)} — aprovado na ARA.`
      : `Média final ${formatGrade(saida.mf)} — abaixo de 5,75.`;
  }
  return null;
}
