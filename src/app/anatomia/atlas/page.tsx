import type { Metadata } from "next";
import { AnatomyAtlas, type AtlasSystem } from "@/components/anatomia/anatomy-atlas";
import { Breadcrumbs } from "@/components/ui/primitives";
import { anatomyData, anatomyLandmarks } from "@/lib/data/anatomia";
import { MODEL_CREDIT } from "@/lib/domain/anatomy-types";

export const metadata: Metadata = {
  title: "Atlas 3D",
  description:
    "O corpo em 3D por sistema e por região: fichas de músculos e ossos e os acidentes ósseos marcados no modelo.",
};

/**
 * Entradas: ?estrutura=femur abre já na ficha; ?sistema=ossos começa com os
 * músculos desligados; ?regiao=coxa leva a câmera até a região;
 * ?estrutura=femur&acidente=trocanter-maior já acende o ponto no osso.
 */
export default async function AtlasPage({
  searchParams,
}: {
  searchParams: Promise<{ estrutura?: string; sistema?: string; regiao?: string; acidente?: string }>;
}) {
  const { estrutura, sistema, regiao, acidente } = await searchParams;
  const system: AtlasSystem | undefined =
    sistema === "ossos" || sistema === "musculos" ? sistema : undefined;
  const regionName = regiao ? anatomyData.regions.find((r) => r.id === regiao)?.name : undefined;

  return (
    <div className="mx-auto max-w-[96rem] px-2 py-2 sm:px-5 sm:py-4">
      {/* No celular cada centímetro vai para o corpo; o caminho volta pela barra de baixo. */}
      <div className="hidden sm:block">
        <Breadcrumbs
          trail={[
            { label: "Atlas de anatomia", href: "/anatomia" },
            ...(regionName && regiao ? [{ label: regionName, href: `/anatomia/regiao/${regiao}` }] : []),
            { label: "3D" },
          ]}
        />
      </div>
      <h1 className="sr-only">Atlas 3D</h1>
      <AnatomyAtlas
        data={anatomyData}
        landmarks={anatomyLandmarks}
        {...(estrutura ? { initialId: estrutura } : {})}
        {...(system ? { initialSystem: system } : {})}
        {...(regiao ? { initialRegion: regiao } : {})}
        {...(acidente ? { initialLandmark: acidente } : {})}
      />
      <p className="text-ink-faint mt-4 text-xs leading-relaxed">{MODEL_CREDIT}</p>
    </div>
  );
}
