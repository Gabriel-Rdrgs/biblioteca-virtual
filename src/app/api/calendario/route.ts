import { NextResponse, type NextRequest } from "next/server";
import { buildIcs } from "@/lib/ics";
import { getCalendarEvents } from "@/lib/repository/calendar";
import { getDisciplines } from "@/lib/repository";

/**
 * O calendário da turma em .ics, para importar no celular.
 *
 * Com `?evento=<id>`, devolve um evento só — é o "adicionar esta prova à
 * minha agenda", que quase sempre é o que se quer, em vez do semestre
 * inteiro.
 *
 * Fica atrás do mesmo portão do resto: o middleware já conferiu a senha da
 * turma quando isto roda. Por isso é um download, e não uma assinatura —
 * um calendário que se atualiza sozinho precisaria de um endereço aberto,
 * sem senha, e as datas da turma não vão virar URL pública sem que isso
 * seja uma decisão consciente. Com conta individual, cada pessoa pode ter
 * o seu próprio endereço assinável.
 */
export async function GET(request: NextRequest) {
  const [events, disciplines] = await Promise.all([getCalendarEvents(), getDisciplines()]);
  const nomes = new Map(disciplines.map((d) => [d.id, d.shortName] as const));

  const pedido = request.nextUrl.searchParams.get("evento");
  const escolhidos = pedido ? events.filter((event) => event.id === pedido) : events;

  if (pedido && escolhidos.length === 0) {
    return new Response("Evento não encontrado.", { status: 404 });
  }

  const nome = pedido ? `atlas-${pedido}.ics` : "atlas-calendario.ics";

  return new NextResponse(buildIcs(escolhidos, { disciplineNames: nomes }), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export const dynamic = "force-dynamic";
