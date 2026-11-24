import type { ReactNode } from "react";
import type { AnatomyRegion, AnatomyStructure, Landmark } from "@/lib/domain/anatomy-types";
import { cn } from "@/lib/utils";

/**
 * A ficha de uma estrutura: o que se pergunta em prova primeiro, depois o
 * que ajuda a lembrar, com o ponto de prova em destaque. Músculo: origem,
 * inserção, ação, inervação. Osso: localização, articulações, acidentes,
 * músculos que se prendem e o que passa pelos forames.
 */

const REF_SHORT: Record<string, string> = {
  moore: "Moore",
  gray: "Gray",
  netter: "Netter",
  sobotta: "Sobotta",
  ta2: "TA2",
  sba: "SBA",
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-ink-faint text-micro font-semibold tracking-[0.12em] uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm leading-relaxed text-pretty">{children}</dd>
    </div>
  );
}

function Sources({ ids, refs }: { ids: readonly string[]; refs: Readonly<Record<string, string>> }) {
  if (ids.length === 0) return null;
  return (
    <p className="text-ink-faint text-xs">
      Fontes:{" "}
      {ids.map((r, i) => (
        <span key={r} title={refs[r] ?? r}>
          {i > 0 ? " · " : ""}
          {REF_SHORT[r] ?? r}
        </span>
      ))}
    </p>
  );
}

export function StructureCardView({
  structure,
  region,
  refs,
  landmarks = [],
  activeLandmark = null,
  onLandmark,
}: {
  structure: AnatomyStructure;
  region?: AnatomyRegion;
  refs: Readonly<Record<string, string>>;
  /** Acidentes marcados no modelo, na mesma ordem dos números. */
  landmarks?: readonly Landmark[];
  activeLandmark?: string | null;
  onLandmark?: (id: string) => void;
}) {
  const f = structure.ficha;
  const b = structure.bone;
  const names = f ?? b;
  return (
    <article className="space-y-5">
      <header>
        <p className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">
          {region?.name ?? structure.region}
          {structure.kind === "connective" ? " · tecido conjuntivo" : ""}
          {b ? ` · ${b.classification}` : ""}
        </p>
        <h2 className="mt-1 text-2xl font-semibold">{structure.namePt}</h2>
        {names ? (
          <p className="text-ink-muted mt-1 text-sm italic">
            {names.nameLatin} · {names.nameEn}
          </p>
        ) : null}
        {names && names.synonyms.length > 0 ? (
          <p className="text-ink-faint mt-1 text-xs">Também: {names.synonyms.join(", ")}</p>
        ) : null}
      </header>

      {structure.summary ? (
        <p className="text-sm leading-relaxed text-pretty">{structure.summary}</p>
      ) : null}

      {f ? (
        <>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label="Origem">{f.origin}</Row>
            <Row label="Inserção">{f.insertion}</Row>
            <Row label="Ação">{f.action}</Row>
            <Row label="Inervação">{f.innervation}</Row>
          </dl>

          {f.examTip ? (
            <div className="bg-danger-soft rounded-panel px-4 py-3">
              <p className="text-danger text-micro font-semibold tracking-[0.14em] uppercase">
                Ponto de prova
              </p>
              <p className="mt-1 text-sm leading-relaxed text-pretty">{f.examTip}</p>
            </div>
          ) : null}

          <dl className="space-y-4">
            <Row label="Localização">{f.location}</Row>
            {f.relations ? <Row label="Relações">{f.relations}</Row> : null}
            <Row label="Como funciona">{f.explanation}</Row>
          </dl>

          {f.mnemonic || f.association ? (
            <div className="bg-primary-soft rounded-panel space-y-2 px-4 py-3">
              {f.mnemonic ? (
                <p className="text-sm leading-relaxed">
                  <span className="text-primary text-micro block font-semibold tracking-[0.14em] uppercase">
                    Para memorizar
                  </span>
                  {f.mnemonic}
                </p>
              ) : null}
              {f.association ? (
                <p className="text-sm leading-relaxed">
                  <span className="text-primary text-micro block font-semibold tracking-[0.14em] uppercase">
                    No dia a dia
                  </span>
                  {f.association}
                </p>
              ) : null}
            </div>
          ) : null}

          {f.note ? <p className="text-ink-muted text-xs leading-relaxed">{f.note}</p> : null}

          <Sources ids={f.refs} refs={refs} />
        </>
      ) : null}

      {b ? (
        <>
          <dl className="space-y-4">
            <Row label="Localização">{b.location}</Row>
            <Row label="Articula-se com">{b.articulations}</Row>
          </dl>

          {landmarks.length ? (
            <div>
              <p className="text-ink-faint text-micro font-semibold tracking-[0.12em] uppercase">
                No modelo — toque para achar
              </p>
              <ol className="mt-1.5 space-y-1">
                {landmarks.map((m, i) => {
                  const on = m.id === activeLandmark;
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => onLandmark?.(m.id)}
                        aria-pressed={on}
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                          on ? "bg-[#ff4d3a]/10" : "hover:bg-surface-sunken",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-full border-2 border-[#ff4d3a] font-mono text-[11px] font-bold",
                            on ? "bg-[#ff4d3a] text-white" : "text-[#c62f20]",
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium">{m.name}</span>
                          {on ? (
                            <span className="text-ink-muted mt-0.5 block text-xs leading-snug">{m.info}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}

          <div>
            <p className="text-ink-faint text-micro font-semibold tracking-[0.12em] uppercase">
              {landmarks.length ? "Todos os acidentes" : "Acidentes"}
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {b.landmarks.map((l) => (
                <li key={l} className="bg-surface-sunken rounded-full px-2.5 py-1 text-xs">
                  {l}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-danger-soft rounded-panel px-4 py-3">
            <p className="text-danger text-micro font-semibold tracking-[0.14em] uppercase">
              Ponto de prova
            </p>
            <p className="mt-1 text-sm leading-relaxed text-pretty">{b.examTip}</p>
          </div>

          <dl className="space-y-4">
            {b.muscles ? <Row label="Músculos que se prendem">{b.muscles}</Row> : null}
            {b.passages ? <Row label="O que passa por ele">{b.passages}</Row> : null}
            <Row label="Como funciona">{b.explanation}</Row>
          </dl>

          {b.mnemonic ? (
            <div className="bg-primary-soft rounded-panel px-4 py-3">
              <p className="text-sm leading-relaxed">
                <span className="text-primary text-micro block font-semibold tracking-[0.14em] uppercase">
                  Para memorizar
                </span>
                {b.mnemonic}
              </p>
            </div>
          ) : null}

          <Sources ids={b.refs} refs={refs} />
        </>
      ) : null}
    </article>
  );
}
