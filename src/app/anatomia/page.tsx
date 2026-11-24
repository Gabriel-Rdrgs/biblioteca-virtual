import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnatomyHome } from "@/components/anatomia/anatomy-home";
import { Breadcrumbs } from "@/components/ui/primitives";
import { allTrainableMuscles, anatomyData, anatomyLessons } from "@/lib/data/anatomia";
import { MODEL_CREDIT } from "@/lib/domain/anatomy-types";

export const metadata: Metadata = {
  title: "Anatomia 3D",
  description:
    "O músculo acende no corpo em 3D e você escreve o nome: lições em três rodadas, revisão espaçada, atlas e desafios.",
};

export default async function AnatomiaPage({
  searchParams,
}: {
  searchParams: Promise<{ estrutura?: string }>;
}) {
  // Endereço antigo da ficha: /anatomia?estrutura=… agora é o atlas.
  const { estrutura } = await searchParams;
  if (estrutura) redirect(`/anatomia/atlas?estrutura=${encodeURIComponent(estrutura)}`);

  const muscles = allTrainableMuscles().map(({ id, namePt, region }) => ({ id, namePt, region }));
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Estudar", href: "/estudar" },
          { label: "Anatomia 3D" },
        ]}
      />
      <h1 className="sr-only">Anatomia 3D</h1>
      <AnatomyHome regions={anatomyData.regions} lessons={anatomyLessons} muscles={muscles} />
      <p className="text-ink-faint mt-8 text-xs leading-relaxed">{MODEL_CREDIT}</p>
    </div>
  );
}
