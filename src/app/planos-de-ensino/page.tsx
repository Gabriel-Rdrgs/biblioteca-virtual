import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { bibliographyLabels } from "@/components/book/book-badge";
import { getBooksForDiscipline, getDisciplines, getTeachingPlans } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Planos de ensino",
  description:
    "Os sete planos de ensino oficiais do 1º período de Medicina do UNIEURO em 2026.2, com a bibliografia extraída de cada um.",
};

// The catalogue is edited at runtime by the admin area; render per request.
export const dynamic = "force-dynamic";

export default async function TeachingPlansPage() {
  const plans = await getTeachingPlans();
  const disciplines = new Map((await getDisciplines()).map((d) => [d.id, d]));
  // Resolved up front: JSX callbacks cannot await.
  const rows = await Promise.all(
    plans.flatMap((plan) => {
      const discipline = disciplines.get(plan.disciplineId);
      return discipline
        ? [getBooksForDiscipline(discipline.id).then((books) => ({ plan, discipline, books }))]
        : [];
    }),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Planos de ensino" }]} />
      <SectionHeading
        as="h1"
        title="Planos de ensino"
        description="Os documentos oficiais das sete unidades curriculares de 2026.2. Toda a bibliografia do Atlas foi transcrita destes arquivos — cada livro guarda a seção e a página de onde veio."
      />

      <ul className="space-y-5">
        {rows.map(({ plan, discipline, books }) => {
          const counts = new Map<string, number>();
          for (const entry of books) {
            const link = entry.links.find((l) => l.disciplineId === discipline.id);
            if (!link) continue;
            counts.set(link.bibliographyType, (counts.get(link.bibliographyType) ?? 0) + 1);
          }

          return (
            <li
              key={plan.id}
              className="border-line bg-surface overflow-hidden rounded-[var(--radius-card)] border"
            >
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-5">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: discipline.colorSoft, color: discipline.color }}
                  aria-hidden="true"
                >
                  <FileText className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-ink-faint flex items-center gap-2 text-xs">
                    <span className="font-medium">{discipline.shortName}</span>
                    <span>· {plan.semester}</span>
                    <span>· {plan.pages} páginas</span>
                  </div>

                  <h2 className="mt-1 text-lg leading-snug font-semibold text-pretty">
                    <Link href={`/disciplinas/${discipline.slug}`} className="hover:text-primary">
                      {discipline.name}
                    </Link>
                  </h2>

                  <div className="bg-surface-sunken mt-3 rounded-md p-3">
                    <p className="text-ink-faint text-xs font-semibold tracking-[0.08em] uppercase">
                      Bibliografia extraída deste plano
                    </p>
                    <ul className="text-ink-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {[...counts.entries()].map(([type, count]) => (
                        <li key={type}>
                          {bibliographyLabels[type as keyof typeof bibliographyLabels]}:{" "}
                          <strong className="text-ink font-medium">{count}</strong>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/disciplinas/${discipline.slug}`}
                      className="text-primary mt-2.5 inline-block text-sm hover:underline"
                    >
                      Abrir os {books.length} livros deste plano
                    </Link>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <a
                      href={plan.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary text-on-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                    >
                      <FileText className="size-4" aria-hidden="true" />
                      Visualizar
                    </a>
                    <a
                      href={plan.fileUrl}
                      download
                      className="border-line hover:border-line-strong hover:bg-surface-sunken inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Baixar
                    </a>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="border-line bg-surface-sunken text-ink-muted mt-8 rounded-[var(--radius-card)] border p-4 text-sm leading-relaxed">
        Os planos de ensino são documentos institucionais do curso de Medicina do UNIEURO. Como todo
        o Atlas, ficam atrás da senha da turma.
      </p>
    </div>
  );
}
