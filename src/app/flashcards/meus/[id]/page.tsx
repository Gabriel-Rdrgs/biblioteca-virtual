import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/primitives";
import { OwnDeckStudy } from "@/components/flashcards/own-deck-study";
import { getDisciplines } from "@/lib/repository";

export const metadata: Metadata = { title: "Meu baralho", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OwnDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const disciplines = await getDisciplines();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Flashcards", href: "/flashcards" },
          { label: "Meu baralho" },
        ]}
      />
      <OwnDeckStudy
        id={id}
        disciplines={disciplines.map((d) => ({ id: d.id, name: d.name, shortName: d.shortName }))}
      />
    </div>
  );
}
