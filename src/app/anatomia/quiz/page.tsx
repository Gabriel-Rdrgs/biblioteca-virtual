import type { Metadata } from "next";
import { AnatomyQuiz } from "@/components/anatomia/anatomy-quiz";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { anatomyData } from "@/lib/data/anatomia";
import { MODEL_CREDIT } from "@/lib/domain/anatomy-types";

export const metadata: Metadata = {
  title: "Quiz de anatomia 3D",
  description: "Identifique, localize e reconheça músculos pela função, no modelo 3D.",
};

export default function AnatomiaQuizPage() {
  return (
    <div className="mx-auto max-w-[96rem] px-3 py-4 sm:px-5">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Anatomia 3D", href: "/anatomia" },
          { label: "Quiz" },
        ]}
      />
      <SectionHeading
        as="h1"
        title="Quiz de anatomia 3D"
        description="Identifique o músculo que acende, toque no que foi pedido ou reconheça pela ação, origem ou inserção. As respostas entram no seu desempenho."
      />
      <AnatomyQuiz data={anatomyData} />
      <p className="text-ink-faint mt-4 text-xs leading-relaxed">{MODEL_CREDIT}</p>
    </div>
  );
}
