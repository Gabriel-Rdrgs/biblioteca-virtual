import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookCard } from "@/components/book/book-card";
import { BookCover } from "@/components/book/book-cover";
import { AccessNotice } from "@/components/ui/access-notice";
import { getBookById, toCatalogEntries } from "@/lib/repository";

function entryOf(id: string) {
  const entry = getBookById(id);
  if (!entry) throw new Error(`livro de teste ausente: ${id}`);
  return toCatalogEntries([entry])[0]!;
}

describe("BookCover", () => {
  it("never passes a generated cover off as the official one", () => {
    render(<BookCover book={entryOf("bates-propedeutica-medica-essencial").book} />);
    const cover = screen.getByRole("img");
    expect(cover).toHaveAccessibleName(/capa ilustrativa gerada/i);
    expect(cover).toHaveAccessibleName(/bates/i);
  });

  it("is silent for screen readers when marked decorative", () => {
    render(<BookCover book={entryOf("porto-exame-clinico").book} decorative />);
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("BookCard", () => {
  it("says in how many disciplines a shared book is used", () => {
    render(<BookCard entry={entryOf("gartner-tratado-de-histologia")} />);
    expect(screen.getByText("Usado em 2 disciplinas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tratado de histologia/i })).toHaveAttribute(
      "href",
      "/livros/gartner-tratado-de-histologia",
    );
  });

  it("does not claim a book is shared when it is not", () => {
    render(<BookCard entry={entryOf("moore-anatomia-clinica")} />);
    expect(screen.queryByText(/usado em \d+ disciplinas/i)).toBeNull();
  });

  it("flags records that still need review", () => {
    render(<BookCard entry={entryOf("parasitologia-contemporanea")} />);
    expect(screen.getByText("Revisar")).toBeInTheDocument();
  });

  it("highlights the search term without altering the title", () => {
    render(<BookCard entry={entryOf("etica-em-pesquisa")} query="etica" />);
    const mark = screen.getByText("Ética", { selector: "mark" });
    expect(mark).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ética em pesquisa/i })).toBeInTheDocument();
  });

  it("shows the institutional access indicator for licensed titles", () => {
    render(<BookCard entry={entryOf("bates-propedeutica-medica-essencial")} />);
    expect(screen.getByText("Biblioteca institucional")).toBeInTheDocument();
  });

  it("labels reference-only items honestly", () => {
    render(<BookCard entry={entryOf("medicina-antiga")} />);
    expect(screen.getByText("Somente referência")).toBeInTheDocument();
  });
});

describe("AccessNotice", () => {
  it("tells the reader when no file is available", () => {
    render(<AccessNotice access="reference_only" />);
    expect(
      screen.getByText("Referência catalogada — arquivo ainda não disponibilizado"),
    ).toBeInTheDocument();
  });

  it("explains institutional access without offering a download", () => {
    render(<AccessNotice access="institutional" />);
    expect(screen.getByText(/nenhum arquivo é hospedado aqui/i)).toBeInTheDocument();
  });
});
