import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { getCatalog, getDisciplines, getTopics, toCatalogEntries } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Todos os livros",
  description:
    "Catálogo completo da bibliografia das sete unidades curriculares do 1º período de Medicina do UNIEURO, semestre 2026.2.",
};

// The catalogue is edited at runtime by the admin area; render per request.
export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const entries = toCatalogEntries(await getCatalog());
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
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Livros" }]} />
      <SectionHeading
        as="h1"
        title="Todos os livros"
        description={`${entries.length} títulos reunidos a partir dos sete planos de ensino de 2026.2. Um livro citado por duas disciplinas aparece uma única vez, com as duas relações.`}
      />
      <CatalogBrowser entries={entries} disciplines={disciplines} topics={await getTopics()} />
    </div>
  );
}
