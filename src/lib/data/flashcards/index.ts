import type { FlashDeck } from "@/lib/domain/flashcard-types";
import curados from "./curados.json";
import membrosSuperiores from "./membros-superiores.json";
import pele from "./pele.json";
import pressaoArterial from "./pressao-arterial.json";
import semiologia from "./semiologia.json";
import virus from "./virus.json";

/**
 * Os baralhos oficiais.
 *
 * Vieram dos roteiros interativos que a turma já usava — membros superiores
 * (Moore, cap. 6), semiologia de cabeça e pescoço, lesões elementares de
 * pele e vírus (Tortora, cap. 13) —, importados para JSON para continuarem
 * sendo dados e não código. As figuras ficam em storage/flashcards, fora do
 * repositório, como as dos simulados. O de aferição da PA foi escrito a
 * partir das Diretrizes Brasileiras de Hipertensão (2020).
 *
 * Os de `curados.json` substituem os cartões gerados do banco de questões:
 * um conceito por cartão, por eixo, escritos a partir do gabarito e dos
 * comentários, com figuras do Gray's Anatomy (domínio público) e do
 * Wikimedia Commons, cada uma com autor e licença na legenda.
 *
 * A ordem em que aparecem para a turma não é esta: é a de `units.ts`.
 *
 * O JSON não carrega tipos; `tests/flashcards.test.ts` confere a forma de
 * cada cartão, e é por isso que a conversão abaixo pode ser direta.
 */
export const seedDecks: readonly FlashDeck[] = [
  ...(membrosSuperiores as unknown as FlashDeck[]),
  ...(semiologia as unknown as FlashDeck[]),
  ...(pressaoArterial as unknown as FlashDeck[]),
  ...(pele as unknown as FlashDeck[]),
  ...(virus as unknown as FlashDeck[]),
  ...(curados as unknown as FlashDeck[]),
];
