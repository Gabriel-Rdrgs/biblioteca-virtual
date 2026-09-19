import type { Metadata } from "next";
import { GlobalSearch } from "@/components/search/global-search";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { getCatalog, getDisciplines, getTeachingPlans, toCatalogEntries } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Busca",
  description: "Busque livros, disciplinas, temas e planos de ensino de uma só vez.",
};

// The catalogue is edited at runtime by the admin area; render per request.
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const initialQuery = (Array.isArray(q) ? q[0] : q) ?? "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Busca" }]} />
      <SectionHeading
        as="h1"
        title="Buscar no acervo"
        description="Procura ao mesmo tempo em livros, autores, disciplinas, temas e planos de ensino. Acentos e maiúsculas não importam."
      />
      <GlobalSearch
        entries={toCatalogEntries(await getCatalog())}
        disciplines={getDisciplines()}
        plans={getTeachingPlans()}
        initialQuery={initialQuery.slice(0, 200)}
      />
    </div>
  );
}
