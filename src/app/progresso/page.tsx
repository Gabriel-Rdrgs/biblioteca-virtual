import type { Metadata } from "next";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { ProgressView } from "@/components/exam/progress-view";

export const metadata: Metadata = {
  title: "Meu progresso",
  description: "Os simulados que você fez e como cada assunto evoluiu no semestre.",
  robots: { index: false },
};

export default function ProgressoPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Meu progresso" }]} />
      <SectionHeading
        as="h1"
        title="Meu progresso"
        description="O que você já treinou e, principalmente, se o assunto em que foi mal continua fraco."
      />
      <ProgressView />
    </div>
  );
}
