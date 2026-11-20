import type { Metadata } from "next";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { ProgressView } from "@/components/exam/progress-view";
import { StudyDashboard } from "@/components/exam/study-dashboard";

export const metadata: Metadata = {
  title: "Desempenho",
  description: "Tudo o que você respondeu, por área e por assunto, e como cada simulado evoluiu.",
  robots: { index: false },
};

export default function ProgressoPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Estudar", href: "/estudar" },
          { label: "Desempenho" },
        ]}
      />
      <SectionHeading
        as="h1"
        title="Desempenho"
        description="Tudo o que você respondeu — modo rápido, simulado de imagem, flashcards e simulados — e, principalmente, onde ainda está errando."
      />
      <StudyDashboard />

      <section className="mt-14">
        <SectionHeading
          title="Simulados completos"
          description="Prova a prova: se o assunto em que você foi mal continua fraco."
        />
        <ProgressView />
      </section>
    </div>
  );
}
