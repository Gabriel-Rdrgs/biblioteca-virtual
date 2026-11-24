import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bone, GraduationCap, PersonStanding, RotateCcw, Target } from "lucide-react";
import { AtlasSearch, type SearchEntry } from "@/components/anatomia/atlas-search";
import { StudyToday } from "@/components/anatomia/study-today";
import { Breadcrumbs } from "@/components/ui/primitives";
import {
  allTrainableMuscles,
  anatomyData,
  anatomyLessons,
  landmarkCount,
  regionIndex,
} from "@/lib/data/anatomia";
import { fold, MODEL_CREDIT, structureNames } from "@/lib/domain/anatomy-types";

export const metadata: Metadata = {
  title: "Atlas de anatomia",
  description:
    "Músculos, ossos e acidentes ósseos num corpo em 3D, organizados por sistema e por região, com lições, revisão e desafios.",
};

/**
 * A porta da anatomia, organizada como um atlas: primeiro achar (busca,
 * sistemas, regiões do corpo), depois estudar. As lições, que antes enchiam
 * esta página, moram em /anatomia/licoes.
 */

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export default async function AnatomiaPage({
  searchParams,
}: {
  searchParams: Promise<{ estrutura?: string }>;
}) {
  // Endereço antigo da ficha: /anatomia?estrutura=… agora é o atlas.
  const { estrutura } = await searchParams;
  if (estrutura) redirect(`/anatomia/atlas?estrutura=${encodeURIComponent(estrutura)}`);

  const regions = regionIndex();
  const regionName = new Map(regions.map((r) => [r.id, r.short]));
  const muscles = anatomyData.structures.filter((s) => s.kind === "muscle").length;
  const bones = anatomyData.structures.filter((s) => s.kind === "bone").length;
  const landmarks = landmarkCount();

  const entries: SearchEntry[] = anatomyData.structures.map((s) => ({
    id: s.id,
    namePt: s.namePt,
    hint: `${s.kind === "bone" ? "Osso" : s.kind === "muscle" ? "Músculo" : "Estrutura"} · ${regionName.get(s.region) ?? ""}`,
    names: structureNames(s).map(fold).join("|"),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="hidden sm:block">
        <Breadcrumbs
          trail={[
            { label: "Início", href: "/" },
            { label: "Estudar", href: "/estudar" },
            { label: "Atlas de anatomia" },
          ]}
        />
      </div>

      <header className="space-y-4">
        <div>
          <p className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">
            Anatomia 3D
          </p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Atlas de anatomia</h1>
          <p className="text-ink-muted mt-1 text-sm sm:text-base">
            {muscles} músculos, {bones} ossos e {landmarks} acidentes ósseos num corpo que se gira com
            o dedo.
          </p>
        </div>
        <AtlasSearch entries={entries} />
        <StudyToday
          lessons={anatomyLessons.map(({ id, title }) => ({ id, title }))}
          trainable={allTrainableMuscles().map((m) => m.id)}
        />
      </header>

      {/* ------------------------------------------------------ sistemas */}
      <section aria-labelledby="sistemas" className="mt-8">
        <h2 id="sistemas" className="mb-3 text-xl font-semibold">
          Sistemas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/anatomia/atlas?sistema=ossos"
            className="glass group flex items-center gap-4 rounded-2xl p-4 transition-colors"
          >
            <span className="bg-primary-soft text-primary grid size-12 shrink-0 place-items-center rounded-xl">
              <Bone className="size-6" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Sistema esquelético</span>
              <span className="text-ink-muted block text-sm">
                {bones} ossos · {landmarks} acidentes no modelo
              </span>
            </span>
            <ArrowRight className="text-ink-faint size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/anatomia/atlas?sistema=musculos"
            className="glass group flex items-center gap-4 rounded-2xl p-4 transition-colors"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#ff4d3a]/12 text-[#d2412f]">
              <PersonStanding className="size-6" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Sistema muscular</span>
              <span className="text-ink-muted block text-sm">
                {muscles} músculos, superficiais e profundos
              </span>
            </span>
            <ArrowRight className="text-ink-faint size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------ regiões */}
      <section aria-labelledby="regioes" className="mt-8">
        <h2 id="regioes" className="mb-3 text-xl font-semibold">
          Regiões do corpo
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {regions.map((r) => (
            <li key={r.id}>
              <Link
                href={`/anatomia/regiao/${r.id}`}
                className="glass flex h-full min-h-24 flex-col justify-between rounded-2xl p-3.5 sm:p-4"
              >
                <span className="leading-tight font-semibold">{r.name}</span>
                <span className="text-ink-muted mt-2 text-xs leading-snug">
                  {plural(r.superficial.length + r.deep.length, "músculo", "músculos")}
                  <br />
                  {plural(r.bones.length, "osso", "ossos")}
                  {r.landmarks ? ` · ${plural(r.landmarks, "acidente", "acidentes")}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------ estudar */}
      <section aria-labelledby="estudar" className="mt-8">
        <h2 id="estudar" className="mb-3 text-xl font-semibold">
          Estudar
        </h2>
        <ul className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          {[
            {
              href: "/anatomia/licoes",
              icon: GraduationCap,
              title: "Lições",
              text: `${anatomyLessons.length} lições: o nome acende e você escreve, em três rodadas.`,
            },
            {
              href: "/anatomia/revisar",
              icon: RotateCcw,
              title: "Revisar",
              text: "O que venceu hoje na revisão espaçada (1, 3, 7, 14, 30 dias).",
            },
            {
              href: "/anatomia/quiz",
              icon: Target,
              title: "Desafiar",
              text: "Identificar, localizar tocando e reconhecer pela função.",
            },
          ].map(({ href, icon: Icon, title, text }) => (
            <li key={href}>
              <Link href={href} className="glass flex h-full items-start gap-3 rounded-2xl p-4">
                <Icon className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block font-semibold">{title}</span>
                  <span className="text-ink-muted block text-sm leading-snug">{text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-ink-faint mt-10 text-xs leading-relaxed">{MODEL_CREDIT}</p>
    </div>
  );
}
