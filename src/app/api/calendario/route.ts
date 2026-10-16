import { NextResponse } from "next/server";
import { buildIcs } from "@/lib/ics";
import { getCalendarEvents } from "@/lib/repository/calendar";
import { getDisciplines } from "@/lib/repository";

/**
 * O calendário da turma em .ics, para importar no celular.
 *
 * Fica atrás do mesmo portão do resto: o middleware já conferiu a senha da
 * turma quando isto roda. Por isso é um download, e não uma assinatura —
 * um calendário que se atualiza sozinho precisaria de um endereço aberto,
 * sem senha, e as datas da turma não vão virar URL pública sem que isso
 * seja uma decisão consciente. Com conta individual, cada pessoa pode ter
 * o seu próprio endereço assinável.
 */
export async function GET() {
  const [events, disciplines] = await Promise.all([getCalendarEvents(), getDisciplines()]);
  const nomes = new Map(disciplines.map((d) => [d.id, d.shortName] as const));

  return new NextResponse(buildIcs(events, { disciplineNames: nomes }), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="atlas-calendario.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}

export const dynamic = "force-dynamic";
