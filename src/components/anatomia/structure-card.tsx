import type { ReactNode } from "react";
import type { AnatomyRegion, AnatomyStructure } from "@/lib/domain/anatomy-types";

/**
 * A ficha de uma estrutura: o que se pergunta em prova primeiro (origem,
 * inserção, ação, inervação), depois o que ajuda a lembrar (explicação,
 * mnemônico, associação) e o ponto de prova em destaque.
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

export function StructureCardView({
  structure,
  region,
  refs,
}: {
  structure: AnatomyStructure;
  region?: AnatomyRegion;
  refs: Readonly<Record<string, string>>;
}) {
  const f = structure.ficha;
  return (
    <article className="space-y-5">
      <header>
        <p className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">
          {region?.name ?? structure.region}
          {structure.kind === "connective" ? " · tecido conjuntivo" : ""}
        </p>
        <h2 className="mt-1 text-2xl font-semibold">{structure.namePt}</h2>
        {f ? (
          <p className="text-ink-muted mt-1 text-sm italic">
            {f.nameLatin} · {f.nameEn}
          </p>
        ) : null}
        {f && f.synonyms.length > 0 ? (
          <p className="text-ink-faint mt-1 text-xs">Também: {f.synonyms.join(", ")}</p>
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

          {f.refs.length > 0 ? (
            <p className="text-ink-faint text-xs">
              Fontes:{" "}
              {f.refs.map((r, i) => (
                <span key={r} title={refs[r] ?? r}>
                  {i > 0 ? " · " : ""}
                  {REF_SHORT[r] ?? r}
                </span>
              ))}
            </p>
          ) : null}
        </>
      ) : null}
    </article>
  );
}
