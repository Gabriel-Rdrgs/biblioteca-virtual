import type { Metadata } from "next";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { DeckEditor } from "@/components/flashcards/deck-editor";
import { getDisciplines } from "@/lib/repository";

export const metadata: Metadata = { title: "Novo baralho", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewDeckPage({
  searchParams,
}: {
  searchParams: Promise<{ importar?: string }>;
}) {
  const { importar } = await searchParams;
  const disciplines = await getDisciplines();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Flashcards", href: "/flashcards" },
          { label: "Novo baralho" },
        ]}
      />
      <SectionHeading
        as="h1"
        title="Novo baralho"
        description="Escreva os seus cartões. Ficam neste aparelho; se quiser, publique para a turma."
      />
      <DeckEditor
        disciplines={disciplines.map((d) => ({ id: d.id, name: d.name, shortName: d.shortName }))}
        startWithImport={importar === "1"}
      />
    </div>
  );
}
