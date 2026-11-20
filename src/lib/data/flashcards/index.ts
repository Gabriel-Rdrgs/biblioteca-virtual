import type { FlashDeck } from "@/lib/domain/flashcard-types";
import membrosSuperiores from "./membros-superiores.json";
import semiologia from "./semiologia.json";

/**
 * Os baralhos oficiais.
 *
 * Vieram dos dois roteiros interativos que a turma já usava — membros
 * superiores (Moore, cap. 6) e semiologia de cabeça e pescoço —, importados
 * para JSON para continuarem sendo dados e não código. As figuras ficam em
 * storage/flashcards, fora do repositório, como as dos simulados.
 *
 * O JSON não carrega tipos; `tests/flashcards.test.ts` confere a forma de
 * cada cartão, e é por isso que a conversão abaixo pode ser direta.
 */
export const seedDecks: readonly FlashDeck[] = [
  ...(membrosSuperiores as unknown as FlashDeck[]),
  ...(semiologia as unknown as FlashDeck[]),
];
