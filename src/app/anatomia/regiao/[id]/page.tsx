import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Box, GraduationCap } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/primitives";
import { anatomyLandmarks, getRegion, regionIndex } from "@/lib/data/anatomia";
import type { AnatomyStructure } from "@/lib/domain/anatomy-types";

export function generateStaticParams() {
  return regionIndex().map((r) => ({ id: r.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const region = getRegion(id);
  return region
    ? { title: `${region.name} · Atlas de anatomia`, description: `Ossos, acidentes e músculos de ${region.name.toLowerCase()}.` }
    : { title: "Região não encontrada" };
}

/**
 * O índice de uma região, como o sumário de um capítulo de atlas: ossos
 * (com quantos acidentes estão marcados), músculos superficiais, profundos
 * e o resto. Cada nome abre o atlas 3D já nele.
 */

function Group({
  title,
  items,
  detail,
}: {
  title: string;
  items: readonly AnatomyStructure[];
  detail?: (s: AnatomyStructure) => string | null;
}) {
  if (items.length === 0) return null;
  return (
    <section className="glass rounded-2xl p-4 sm:p-5">
      <h2 className="mb-2 flex items-baseline justify-between gap-2 font-semibold">
        {title}
        <span className="text-ink-faint font-mono text-xs font-normal">{items.length}</span>
      </h2>
      <ul className="divide-line divide-y">
        {items.map((s) => {
          const extra = detail?.(s);
          return (
            <li key={s.id}>
              <Link
                href={`/anatomia/atlas?estrutura=${s.id}`}
                className="hover:text-primary flex min-h-11 items-center justify-between gap-3 py-2"
              >
                <span className="min-w-0 truncate">{s.namePt}</span>
                <span className="text-ink-faint flex shrink-0 items-center gap-1.5 text-xs">
                  {extra}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default async function RegiaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const all = regionIndex();
  const i = all.findIndex((r) => r.id === id);
  const region = all[i];
  if (!region) notFound();
  const prev = all[i - 1];
  const next = all[i + 1];

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6">
      <Breadcrumbs
        trail={[
          { label: "Atlas de anatomia", href: "/anatomia" },
          { label: region.name },
        ]}
      />
      <header className="mb-6">
        <p className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">Região</p>
        <h1 className="mt-1 text-3xl font-semibold">{region.name}</h1>
        <p className="text-ink-muted mt-1 text-sm">
          {region.bones.length} ossos · {region.superficial.length + region.deep.length} músculos
          {region.landmarks ? ` · ${region.landmarks} acidentes marcados no modelo` : ""}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
          <Link
            href={`/anatomia/atlas?regiao=${region.id}`}
            className="bg-primary text-on-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold"
          >
            <Box className="size-4" aria-hidden="true" />
            Ver em 3D
          </Link>
          <Link
            href={`/anatomia/licoes#${region.id}`}
            className="glass-strong inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold"
          >
            <GraduationCap className="size-4" aria-hidden="true" />
            Lições
          </Link>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <Group
          title="Ossos"
          items={region.bones}
          detail={(s) => {
            const n = anatomyLandmarks[s.id]?.length ?? 0;
            return n ? `${n} acidente${n > 1 ? "s" : ""}` : null;
          }}
        />
        <Group title="Músculos superficiais" items={region.superficial} />
        <Group title="Músculos profundos" items={region.deep} />
        <Group title="Outras estruturas" items={region.others} />
      </div>

      <nav aria-label="Outras regiões" className="mt-8 grid grid-cols-2 gap-2">
        {prev ? (
          <Link href={`/anatomia/regiao/${prev.id}`} className="glass flex min-h-14 items-center gap-2 rounded-2xl px-4">
            <ArrowLeft className="text-ink-faint size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate text-sm font-medium">{prev.name}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/anatomia/regiao/${next.id}`}
            className="glass flex min-h-14 items-center justify-end gap-2 rounded-2xl px-4 text-right"
          >
            <span className="min-w-0 truncate text-sm font-medium">{next.name}</span>
            <ArrowRight className="text-ink-faint size-4 shrink-0" aria-hidden="true" />
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
