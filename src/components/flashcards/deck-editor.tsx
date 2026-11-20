"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, Plus, Save, Send, Trash2, Upload, Users } from "lucide-react";
import { SHARED_DECK_LIMITS as LIMITS } from "@/lib/domain/flashcard-types";
import {
  deckFromText,
  deckToFile,
  deleteOwnDeck,
  loadOwnDeck,
  newId,
  saveOwnDeck,
  type OwnCard,
  type OwnDeck,
} from "@/lib/flashcard-storage";
import { slugify } from "@/lib/domain/normalize";
import {
  Button,
  ButtonLink,
  Field,
  Input,
  Notice,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import type { HubDiscipline } from "./deck-hub";

/**
 * Escrever um baralho.
 *
 * Fica no aparelho até a pessoa decidir publicar. Publicar manda uma cópia
 * para o servidor e guarda aqui o segredo que permite atualizar ou retirar
 * depois. Editar o baralho local não muda o publicado sozinho: é preciso
 * apertar "atualizar" — assim ninguém publica sem querer um rascunho.
 */

const TOKEN_HEADER = "x-baralho-segredo";

type Status = { tone: "erro" | "ok" | "aviso"; text: string } | null;

function emptyCard(): OwnCard {
  return { id: newId("c"), front: "", back: "" };
}

export function DeckEditor({
  deckId,
  disciplines,
  startWithImport = false,
}: {
  deckId?: string;
  disciplines: readonly HubDiscipline[];
  startWithImport?: boolean;
}) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(!deckId);
  const [missing, setMissing] = useState(false);
  const [id] = useState(() => deckId ?? newId("b"));
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [disciplineId, setDisciplineId] = useState(disciplines[0]?.id ?? "");
  const [author, setAuthor] = useState("");
  const [cards, setCards] = useState<OwnCard[]>([emptyCard(), emptyCard()]);
  const [published, setPublished] = useState<OwnDeck["published"]>(undefined);
  const [showImport, setShowImport] = useState(startWithImport);
  const [importText, setImportText] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!deckId) return;
    const deck = loadOwnDeck(deckId);
    if (!deck) {
      setMissing(true);
    } else {
      setTitle(deck.title);
      setDescription(deck.description);
      setDisciplineId(deck.disciplineId || disciplines[0]?.id || "");
      setAuthor(deck.author ?? "");
      setCards(deck.cards.length ? [...deck.cards] : [emptyCard()]);
      setPublished(deck.published);
      setCreatedAt(deck.createdAt);
    }
    setLoaded(true);
  }, [deckId, disciplines]);

  if (!loaded) return <p className="text-ink-muted py-16 text-center text-sm">Carregando…</p>;
  if (missing) {
    return (
      <Notice tone="erro">
        Este baralho não está neste aparelho. Baralhos próprios ficam no navegador em que foram
        criados.
      </Notice>
    );
  }

  const filled = cards.filter((c) => c.front.trim() && c.back.trim());

  const build = (): OwnDeck => ({
    id,
    title: title.trim() || "Baralho sem título",
    description: description.trim(),
    disciplineId,
    ...(author.trim() ? { author: author.trim() } : {}),
    cards: filled.map((c) => ({ id: c.id, front: c.front.trim(), back: c.back.trim() })),
    createdAt,
    updatedAt: new Date().toISOString(),
    ...(published ? { published } : {}),
  });

  const save = (thenStudy: boolean) => {
    if (filled.length === 0) {
      setStatus({ tone: "erro", text: "Escreva ao menos um cartão com frente e verso." });
      return;
    }
    saveOwnDeck(build());
    if (thenStudy) router.push(`/flashcards/meus/${id}`);
    else setStatus({ tone: "ok", text: "Salvo neste aparelho." });
  };

  const updateCard = (cardId: string, patch: Partial<OwnCard>) =>
    setCards((list) => list.map((c) => (c.id === cardId ? { ...c, ...patch } : c)));

  const importCards = (text: string, fileName?: string) => {
    const parsed = deckFromText(text, fileName?.replace(/\.[^.]+$/, "") || "Baralho importado");
    if (!parsed) {
      setStatus({
        tone: "erro",
        text: "Não reconheci o formato. Use um arquivo exportado pelo Atlas, ou texto com frente e verso separados por TAB (o que o Anki e o Quizlet exportam).",
      });
      return;
    }
    setCards((list) => [...list.filter((c) => c.front.trim() || c.back.trim()), ...parsed.cards]);
    if (!title.trim()) setTitle(parsed.title);
    if (!description.trim() && parsed.description) setDescription(parsed.description);
    if (parsed.disciplineId && disciplines.some((d) => d.id === parsed.disciplineId)) {
      setDisciplineId(parsed.disciplineId);
    }
    setImportText("");
    setShowImport(false);
    setStatus({ tone: "ok", text: `${parsed.cards.length} cartões importados. Revise e salve.` });
  };

  const exportFile = () => {
    const blob = new Blob([deckToFile(build())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(title || "baralho") || "baralho"}.atlas.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const payload = () => ({
    title: title.trim(),
    description: description.trim(),
    disciplineId,
    ...(author.trim() ? { author: author.trim() } : {}),
    cards: filled.map((c) => ({
      id: c.id.replace(/[^a-z0-9-]/gi, "").slice(0, 40) || undefined,
      front: c.front.trim(),
      back: c.back.trim(),
    })),
  });

  const publishProblem = (): string | null => {
    if (title.trim().length < 3) return "Dê um título de pelo menos 3 letras antes de publicar.";
    if (filled.length === 0) return "O baralho precisa de ao menos um cartão completo.";
    if (filled.length > LIMITS.cardsPerDeck) {
      return `Um baralho da turma vai até ${LIMITS.cardsPerDeck} cartões; divida este em dois.`;
    }
    const long = filled.findIndex(
      (c) => c.front.trim().length > LIMITS.front || c.back.trim().length > LIMITS.back,
    );
    if (long >= 0) return `O cartão ${long + 1} passou do tamanho máximo. Encurte ou divida.`;
    return null;
  };

  const publish = async () => {
    const problem = publishProblem();
    if (problem) {
      setStatus({ tone: "erro", text: problem });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(
        published ? `/api/flashcards/turma/${published.id}` : "/api/flashcards/turma",
        {
          method: published ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...(published ? { [TOKEN_HEADER]: published.token } : {}),
          },
          body: JSON.stringify(payload()),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        id?: string;
        token?: string;
      };
      if (!response.ok) throw new Error(data.error ?? `Falha ${response.status}`);
      const nextPublished =
        published ?? { id: data.id ?? "", token: data.token ?? "", at: new Date().toISOString() };
      const record: OwnDeck = {
        ...build(),
        published: { ...nextPublished, at: new Date().toISOString() },
      };
      saveOwnDeck(record);
      setPublished(record.published);
      setStatus({
        tone: "ok",
        text: published
          ? "Publicação atualizada para a turma."
          : "Publicado! A turma já vê o baralho em Flashcards.",
      });
    } catch (error) {
      setStatus({ tone: "erro", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (!published) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/flashcards/turma/${published.id}`, {
        method: "DELETE",
        headers: { [TOKEN_HEADER]: published.token },
      });
      // 404: já tinha saído (o admin apagou). O que importa é esquecer o vínculo.
      if (!response.ok && response.status !== 404) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Falha ${response.status}`);
      }
      const { published: _gone, ...rest } = build();
      saveOwnDeck(rest);
      setPublished(undefined);
      setStatus({ tone: "ok", text: "Retirado da turma. Sua cópia continua aqui." });
    } catch (error) {
      setStatus({ tone: "erro", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        <section className="glass rounded-hero space-y-4 p-5 sm:p-6">
          <Field label="Título" htmlFor="titulo" required>
            <Input
              id="titulo"
              value={title}
              maxLength={LIMITS.title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Nervos do plexo braquial"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Matéria" htmlFor="materia" required>
              <Select id="materia" value={disciplineId} onChange={(e) => setDisciplineId(e.target.value)}>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.shortName} — {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Descrição" htmlFor="descricao" hint="Opcional: de onde vem, para que prova.">
              <Input
                id="descricao"
                value={description}
                maxLength={LIMITS.description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section aria-labelledby="cartoes" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="cartoes" className="text-xl font-semibold">
                Cartões <span className="text-ink-faint text-base tabular-nums">({filled.length})</span>
              </h2>
              <p className="text-ink-muted text-sm">
                Use <code className="text-xs">**assim**</code> para negrito. Uma pergunta por cartão
                funciona melhor que três.
              </p>
            </div>
            <Button type="button" size="sm" variant="secundario" onClick={() => setShowImport((v) => !v)}>
              <Upload className="size-4" aria-hidden="true" />
              Importar cartões
            </Button>
          </div>

          {showImport ? (
            <div className="glass rounded-panel space-y-3 p-4">
              <p className="text-ink-muted text-sm leading-relaxed">
                Escolha um arquivo exportado pelo Atlas (<code className="text-xs">.atlas.json</code>)
                ou um texto do Anki/Quizlet com frente e verso separados por TAB. Também dá para
                colar o texto abaixo.
              </p>
              <input
                ref={fileInput}
                type="file"
                accept=".json,.txt,.tsv,.csv,application/json,text/plain"
                className="text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) importCards(await file.text(), file.name);
                  if (fileInput.current) fileInput.current.value = "";
                }}
              />
              <Textarea
                aria-label="Colar cartões"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={"Frente[TAB]Verso\nOutra frente[TAB]Outro verso"}
              />
              <Button
                type="button"
                size="sm"
                disabled={!importText.trim()}
                onClick={() => importCards(importText)}
              >
                Importar o texto colado
              </Button>
            </div>
          ) : null}

          <ol className="space-y-3">
            {cards.map((card, i) => (
              <li key={card.id} className="glass rounded-panel p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-ink-faint text-xs font-semibold tabular-nums">
                    Cartão {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCards((list) =>
                        list.length > 1 ? list.filter((c) => c.id !== card.id) : [emptyCard()],
                      )
                    }
                    className="text-ink-faint hover:text-danger inline-flex min-h-9 items-center gap-1 text-xs"
                    aria-label={`Apagar o cartão ${i + 1}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Apagar
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Textarea
                    aria-label={`Frente do cartão ${i + 1}`}
                    placeholder="Frente: a pergunta"
                    value={card.front}
                    maxLength={LIMITS.front}
                    onChange={(e) => updateCard(card.id, { front: e.target.value })}
                  />
                  <Textarea
                    aria-label={`Verso do cartão ${i + 1}`}
                    placeholder="Verso: a resposta"
                    value={card.back}
                    maxLength={LIMITS.back}
                    onChange={(e) => updateCard(card.id, { back: e.target.value })}
                    onKeyDown={(e) => {
                      // Ctrl+Enter no último verso abre o próximo cartão.
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && i === cards.length - 1) {
                        e.preventDefault();
                        setCards((list) => [...list, emptyCard()]);
                      }
                    }}
                  />
                </div>
              </li>
            ))}
          </ol>
          <Button type="button" variant="secundario" onClick={() => setCards((l) => [...l, emptyCard()])}>
            <Plus className="size-4" aria-hidden="true" />
            Adicionar cartão
          </Button>
          <p className="text-ink-faint text-xs">Dica: Ctrl+Enter no último verso cria outro cartão.</p>
        </section>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-24">
        {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}

        <section className="glass rounded-panel space-y-2 p-4">
          <Button type="button" block onClick={() => save(true)}>
            <Save className="size-4" aria-hidden="true" />
            Salvar e estudar
          </Button>
          <Button type="button" block variant="secundario" onClick={() => save(false)}>
            Só salvar
          </Button>
          <Button type="button" block variant="fantasma" onClick={exportFile} disabled={filled.length === 0}>
            <Download className="size-4" aria-hidden="true" />
            Exportar arquivo
          </Button>
          <p className="text-ink-faint text-xs leading-relaxed">
            Fica salvo só neste navegador. Exporte para levar a outro aparelho ou mandar a um
            colega.
          </p>
        </section>

        <section className="glass rounded-panel space-y-3 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="text-primary size-4" aria-hidden="true" />
            Compartilhar com a turma
          </h2>
          {published ? (
            <>
              <p className="text-ink-muted text-sm leading-relaxed">
                Publicado. Mudanças aqui só chegam à turma quando você atualizar.
              </p>
              <Link
                href={`/flashcards/turma/${published.id}`}
                className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                Ver como a turma vê
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
              <Button type="button" block size="sm" onClick={publish} disabled={busy}>
                <Send className="size-4" aria-hidden="true" />
                Atualizar publicação
              </Button>
              <Button type="button" block size="sm" variant="perigo" onClick={withdraw} disabled={busy}>
                Retirar da turma
              </Button>
            </>
          ) : (
            <>
              <p className="text-ink-muted text-sm leading-relaxed">
                Todos com a senha da turma poderão estudar. Só este aparelho poderá editar ou
                retirar; o admin também pode ocultar.
              </p>
              <Field label="Assinar como" htmlFor="autor" hint="Opcional. Deixe vazio para publicar sem nome.">
                <Input
                  id="autor"
                  value={author}
                  maxLength={LIMITS.author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </Field>
              <Button type="button" block size="sm" onClick={publish} disabled={busy}>
                <Send className="size-4" aria-hidden="true" />
                {busy ? "Publicando…" : "Publicar para a turma"}
              </Button>
            </>
          )}
        </section>

        {deckId ? (
          <section className="glass rounded-panel space-y-2 p-4">
            {confirmDelete ? (
              <>
                <p className="text-sm">
                  Apagar este baralho deste aparelho?
                  {published ? " A cópia publicada continua com a turma até você retirá-la." : ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="perigo"
                    onClick={() => {
                      deleteOwnDeck(id);
                      router.push("/flashcards");
                    }}
                  >
                    Apagar
                  </Button>
                  <Button type="button" size="sm" variant="fantasma" onClick={() => setConfirmDelete(false)}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <Button type="button" size="sm" variant="fantasma" block onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Apagar baralho
              </Button>
            )}
          </section>
        ) : (
          <ButtonLink href="/flashcards" variant="fantasma" size="sm" block>
            Cancelar
          </ButtonLink>
        )}
      </aside>
    </div>
  );
}
