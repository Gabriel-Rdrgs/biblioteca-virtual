import type { Metadata } from "next";
import { ArrowRight, BookOpen } from "lucide-react";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { Breadcrumbs, CardLink, SectionHeading } from "@/components/ui/primitives";
import { getCatalog, getDisciplines, getTopics, toCatalogEntries } from "@/lib/repository";
import { getSummaries } from "@/lib/repository/summaries";

export const metadata: Metadata = {
  title: "Todos os livros",
  description:
    "Catálogo completo da bibliografia das oito unidades curriculares do 1º período de Medicina do UNIEURO, semestre 2026.2.",
};

// The catalogue is edited at runtime by the admin area; render per request.
export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const entries = toCatalogEntries(await getCatalog());
  const summaries = await getSummaries();
  const disciplines = (await getDisciplines()).map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    shortName: d.shortName,
    color: d.color,
    colorSoft: d.colorSoft,
    period: d.period,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Biblioteca" }]} />
      <SectionHeading
        as="h1"
        title="Todos os livros"
        description={`${entries.length} títulos reunidos a partir dos oito planos de ensino de 2026.2. Um livro citado por duas disciplinas aparece uma única vez, com as duas relações.`}
      />
      {summaries.length > 0 ? (
        <CardLink href="/resumos" raio="hero" className="mb-8 flex items-center gap-4">
          <BookOpen className="text-primary size-6 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Resumos da turma</span>
            <span className="text-ink-muted block text-sm leading-relaxed">
              Um por aula, com o que foi dado naquele encontro. {summaries.length}{" "}
              {summaries.length === 1 ? "publicado" : "publicados"}.
            </span>
          </span>
          <ArrowRight className="text-ink-faint size-4 shrink-0" aria-hidden="true" />
        </CardLink>
      ) : null}
      <CatalogBrowser entries={entries} disciplines={disciplines} topics={await getTopics()} />
    </div>
  );
}
