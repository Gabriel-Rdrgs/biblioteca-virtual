import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookCard } from "@/components/book/book-card";
import { BookCover } from "@/components/book/book-cover";
import { AccessNotice } from "@/components/ui/access-notice";
import { books } from "@/lib/data/books";
import { bookDisciplines } from "@/lib/data/book-disciplines";
import { disciplines } from "@/lib/data/disciplines";
import { toCatalogEntries } from "@/lib/repository";

// Built straight from the seeds so hidden books stay usable as fixtures.
const disciplineById = new Map(disciplines.map((d) => [d.id, d]));
async function entryOf(id: string) {
  const book = books.find((b) => b.id === id);
  if (!book) throw new Error(`livro de teste ausente: ${id}`);
  const links = bookDisciplines
    .filter((l) => l.bookId === id)
    .map((l) => ({ ...l, discipline: disciplineById.get(l.disciplineId)! }));
  return toCatalogEntries([{ book, links }])[0]!;
}

describe("BookCover", () => {
  it("never passes a generated cover off as the official one", async () => {
    render(<BookCover book={(await entryOf("bates-propedeutica-medica-essencial")).book} />);
    const cover = screen.getByRole("img");
    expect(cover).toHaveAccessibleName(/capa ilustrativa gerada/i);
    expect(cover).toHaveAccessibleName(/bates/i);
  });

  it("is silent for screen readers when marked decorative", async () => {
    render(<BookCover book={(await entryOf("porto-exame-clinico")).book} decorative />);
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("BookCard", () => {
  it("says in how many disciplines a shared book is used", async () => {
    render(<BookCard entry={await entryOf("gartner-tratado-de-histologia")} />);
    expect(screen.getByText("Usado em 2 disciplinas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tratado de histologia/i })).toHaveAttribute(
      "href",
      "/livros/gartner-tratado-de-histologia",
    );
  });

  it("does not claim a book is shared when it is not", async () => {
    render(<BookCard entry={await entryOf("moore-anatomia-clinica")} />);
    expect(screen.queryByText(/usado em \d+ disciplinas/i)).toBeNull();
  });

  it("flags records that still need review", async () => {
    render(<BookCard entry={await entryOf("parasitologia-contemporanea")} />);
    expect(screen.getByText("Revisar")).toBeInTheDocument();
  });

  it("highlights the search term without altering the title", async () => {
    render(<BookCard entry={await entryOf("etica-em-pesquisa")} query="etica" />);
    const mark = screen.getByText("Ética", { selector: "mark" });
    expect(mark).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ética em pesquisa/i })).toBeInTheDocument();
  });

  it("shows a book without a posted file as reference only", async () => {
    render(<BookCard entry={await entryOf("bates-propedeutica-medica-essencial")} />);
    expect(screen.getByText("Somente referência")).toBeInTheDocument();
  });

  it("labels reference-only items honestly", async () => {
    render(<BookCard entry={await entryOf("medicina-antiga")} />);
    expect(screen.getByText("Somente referência")).toBeInTheDocument();
  });
});

describe("AccessNotice", () => {
  it("tells the reader when no file is available", async () => {
    render(<AccessNotice access="reference_only" />);
    expect(
      screen.getByText("Referência catalogada — arquivo ainda não disponibilizado"),
    ).toBeInTheDocument();
  });

  it("names origin and authorisation for a class-posted file", async () => {
    render(
      <AccessNotice
        access="class_only"
        file={{
          path: "x.pdf",
          origin: "Enviado por A.",
          authorization: "Cópia própria",
          addedAt: "2026-09-20",
        }}
      />,
    );
    expect(screen.getByText(/origem: enviado por a./i)).toBeInTheDocument();
    expect(screen.getByText(/autorização: cópia própria/i)).toBeInTheDocument();
  });
});
