import { redirect } from "next/navigation";

/**
 * Os simulados viraram uma parte de "Estudar", ao lado do desempenho, do
 * modo rápido e dos flashcards. O endereço antigo continua valendo: há link para
 * ele no calendário, nas matérias e em conversas da turma.
 */
export default function SimuladosPage() {
  redirect("/estudar");
}
