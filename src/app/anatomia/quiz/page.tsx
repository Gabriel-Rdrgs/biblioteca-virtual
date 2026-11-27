import type { Metadata } from "next";
import { AnatomyQuiz } from "@/components/anatomia/anatomy-quiz";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { anatomyData, anatomyLandmarks } from "@/lib/data/anatomia";
import { MODEL_CREDIT } from "@/lib/domain/anatomy-types";

export const metadata: Metadata = {
  title: "Desafiar · Anatomia 3D",
  description: "Identifique e localize músculos, ossos e acidentes ósseos no modelo 3D, e reconheça músculos pela função.",
};

export default function AnatomiaQuizPage() {
  return (
    <div className="mx-auto max-w-[96rem] px-2 py-2 sm:px-5 sm:py-4">
      <div className="hidden sm:block">
        <Breadcrumbs
          trail={[
            { label: "Início", href: "/" },
            { label: "Anatomia 3D", href: "/anatomia" },
            { label: "Desafiar" },
          ]}
        />
        <SectionHeading
          as="h1"
          title="Desafiar"
          description="Músculos, ossos e acidentes ósseos: identifique o que acende, toque no que foi pedido ou reconheça o músculo pela ação, origem ou inserção. As respostas entram no seu desempenho e na revisão espaçada."
        />
      </div>
      <h1 className="mb-2 px-1 text-xl font-semibold sm:hidden">Desafiar</h1>
      <AnatomyQuiz data={anatomyData} landmarks={anatomyLandmarks} />
      <p className="text-ink-faint mt-4 text-xs leading-relaxed">{MODEL_CREDIT}</p>
    </div>
  );
}
