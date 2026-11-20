import { Fragment } from "react";

/**
 * O texto de um cartão: parágrafos, quebras de linha e `**negrito**`.
 *
 * Monta elementos React, nunca HTML. Um baralho da turma foi escrito por
 * qualquer pessoa com a senha, e `<img onerror>` num cartão seria código de
 * outra pessoa rodando no seu navegador.
 */

function inline(text: string, keyBase: string) {
  // Partes ímpares do split ficaram entre ** **.
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyBase}-${i}`} className="font-semibold">
        {part}
      </strong>
    ) : (
      <Fragment key={`${keyBase}-${i}`}>{part}</Fragment>
    ),
  );
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div className={className}>
      {paragraphs.map((paragraph, p) => (
        <p key={p} className={p > 0 ? "mt-3" : undefined}>
          {paragraph.split("\n").map((line, l) => (
            <Fragment key={l}>
              {l > 0 ? <br /> : null}
              {inline(line, `${p}-${l}`)}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

/** Para títulos e listas, onde a marcação só atrapalha. */
export function plainText(text: string): string {
  return text.replace(/\*\*/g, "");
}
