import type { Metadata } from "next";
import { AnatomyAtlas } from "@/components/anatomia/anatomy-atlas";
import { Breadcrumbs } from "@/components/ui/primitives";
import { anatomyData } from "@/lib/data/anatomia";
import { MODEL_CREDIT } from "@/lib/domain/anatomy-types";

export const metadata: Metadata = {
  title: "Atlas 3D",
  description: "O corpo em 3D: toque num músculo e veja origem, inserção, ação, inervação e o ponto de prova.",
};

export default async function AtlasPage({
  searchParams,
}: {
  searchParams: Promise<{ estrutura?: string }>;
}) {
  const { estrutura } = await searchParams;
  return (
    <div className="mx-auto max-w-[96rem] px-3 py-4 sm:px-5">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Anatomia 3D", href: "/anatomia" },
          { label: "Atlas" },
        ]}
      />
      <h1 className="sr-only">Atlas 3D</h1>
      <AnatomyAtlas data={anatomyData} {...(estrutura ? { initialId: estrutura } : {})} />
      <p className="text-ink-faint mt-4 text-xs leading-relaxed">{MODEL_CREDIT}</p>
    </div>
  );
}
