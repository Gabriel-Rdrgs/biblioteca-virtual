import type { Metadata } from "next";
import { DisciplineCard } from "@/components/discipline/discipline-card";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { periodLabel } from "@/lib/domain/types";
import { getDisciplineBookCounts, getDisciplinesByPeriod } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Matérias",
  description:
    "As matérias do curso, organizadas por período, com ementa, livros e plano de ensino.",
};

// The catalogue is edited at runtime by the admin area; render per request.
export const dynamic = "force-dynamic";

export default async function DisciplinesPage() {
  const [groups, counts] = await Promise.all([getDisciplinesByPeriod(), getDisciplineBookCounts()]);
  const total = groups.reduce((sum, group) => sum + group.disciplines.length, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Matérias" }]} />
      <SectionHeading
        as="h1"
        title="Matérias"
        description={`${total} ${total === 1 ? "matéria" : "matérias"} em ${groups.length} ${groups.length === 1 ? "período" : "períodos"}. O período atual vem primeiro; os anteriores continuam aqui embaixo.`}
      />

      <div className="space-y-14">
        {groups.map((group) => (
          <section key={group.period} aria-labelledby={`periodo-${group.period}`}>
            <div className="mb-5 flex flex-wrap items-baseline gap-3">
              <h2 id={`periodo-${group.period}`} className="text-xl font-semibold">
                {periodLabel(group.period)}
              </h2>
              {group.current ? (
                <span className="glass-strong text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  período atual
                </span>
              ) : null}
              <span className="text-ink-faint text-sm">
                {[...new Set(group.disciplines.map((d) => d.semester))].join(" · ")}
              </span>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.disciplines.map((discipline) => (
                <li key={discipline.id} className="flex">
                  <DisciplineCard
                    discipline={discipline}
                    bookCount={counts.get(discipline.id) ?? 0}
                    className="w-full"
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
