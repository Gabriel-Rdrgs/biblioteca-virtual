"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Slot, TypingState } from "@/lib/domain/anatomy-typing";
import { cn } from "@/lib/utils";

/**
 * O nome sendo digitado, em letras grandes.
 *
 * - rodada 1: o nome inteiro em cinza; o que se digita fica coral;
 * - rodada 2: só a primeira letra; o resto são pontos, um por letra;
 * - rodada 3: nada — o nome aparece à medida que se escreve.
 *
 * Letra revelada por erro fica âmbar. Depois da resposta (`reveal`), o que
 * faltava aparece em cinza claro.
 */

export function TypedName({
  slots,
  typing,
  round,
  reveal,
  shakeKey,
}: {
  slots: readonly Slot[];
  typing: TypingState;
  round: 1 | 2 | 3;
  reveal: boolean;
  shakeKey: number;
}) {
  const letters = slots.filter((s) => s.key !== null).length;
  const size =
    letters <= 11
      ? "clamp(34px, 7.4vw, 64px)"
      : letters <= 19
        ? "clamp(28px, 5.6vw, 52px)"
        : "clamp(22px, 4.3vw, 40px)";
  const first = slots.findIndex((s) => s.key !== null);

  // Palavras inteiras não quebram no meio.
  const words: { slot: Slot; i: number }[][] = [[]];
  slots.forEach((slot, i) => {
    if (slot.char === " ") words.push([]);
    else words[words.length - 1]?.push({ slot, i });
  });

  const caretAt = typing.done ? -1 : typing.pos;
  let lastTyped = -1;
  for (let i = Math.min(typing.pos, slots.length) - 1; i >= 0; i--) {
    if (slots[i]?.key !== null) {
      lastTyped = i;
      break;
    }
  }
  const clean = reveal && typing.done && typing.revealed.length === 0;

  const letter = (slot: Slot, i: number) => {
    const typed = i < typing.pos;
    const revealed = typing.revealed.includes(i);
    let char: string | null = slot.char;
    let tone = "text-white/25";
    if (revealed) tone = "text-amber-400";
    else if (typed) tone = "text-[#ff6a55]";
    else if (reveal) tone = "text-white/70";
    else if (round === 2) char = i === first || slot.key === null ? slot.char : "•";
    else if (round === 3) char = null;
    if (char === null) return null;
    return (
      <span
        className={cn(
          "transition-colors duration-100",
          tone,
          char === "•" && "px-[0.06em] align-middle text-[0.55em]",
          typed && !revealed && i === lastTyped && !reveal && "letter-in",
        )}
      >
        {char}
      </span>
    );
  };

  return (
    <div
      key={shakeKey}
      className={cn(
        "font-display flex min-h-[1.2em] flex-wrap items-baseline justify-center gap-x-[0.32em] leading-[1.12] font-medium tracking-tight",
        clean ? "type-done" : shakeKey > 0 && !reveal && "type-shake",
      )}
      style={{ fontSize: size }}
      aria-live="polite"
    >
      {words.map((word, w) => {
        const end = word.length ? (word[word.length - 1]?.i ?? -2) + 1 : -1;
        return (
          <span key={w} className="whitespace-nowrap">
            {word.map(({ slot, i }) => (
              <span key={i}>
                {caretAt === i ? <span className="type-caret" /> : null}
                {letter(slot, i)}
              </span>
            ))}
            {caretAt === end ? <span className="type-caret" /> : null}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Captura o teclado, inclusive o virtual do celular: um campo invisível por
 * cima do nome recebe o texto, e cada caractere novo vira uma tecla. No
 * computador o foco vai sozinho para o campo; no celular, um toque abre o
 * teclado.
 */
export function KeyCatcher({
  onKey,
  onEnter,
  resetKey,
  children,
}: {
  onKey: (key: string) => void;
  onEnter: () => void;
  resetKey: string;
  children: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const previous = useRef("");
  const [focused, setFocused] = useState(false);
  const coarse = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
    [],
  );

  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.value = "";
    previous.current = "";
    if (!coarse) el.focus({ preventScroll: true });
  }, [resetKey, coarse]);

  const feed = (value: string) => {
    let same = 0;
    while (same < value.length && same < previous.current.length && value[same] === previous.current[same]) same++;
    previous.current = value;
    for (const ch of value.slice(same)) onKey(ch);
  };

  return (
    <div className="pointer-events-auto relative w-full">
      {children}
      <input
        ref={input}
        type="text"
        inputMode="text"
        aria-label="Digite o nome do músculo"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="next"
        className="absolute inset-0 h-full w-full cursor-default bg-transparent text-[16px] text-transparent caret-transparent opacity-0 outline-none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          const el = event.currentTarget;
          feed(el.value);
          const composing = (event.nativeEvent as InputEvent).isComposing;
          if (!composing && el.value.length > 40) {
            el.value = "";
            previous.current = "";
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onEnter();
          }
        }}
      />
      {coarse && !focused ? (
        <p className="pointer-events-none mt-1 font-mono text-[11px] tracking-wide text-[#ff8a78]">
          toque aqui para digitar
        </p>
      ) : null}
    </div>
  );
}
