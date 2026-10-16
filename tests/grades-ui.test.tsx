import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GradePanel } from "@/components/grades/grade-panel";
import { DisciplineGrades } from "@/components/grades/discipline-grades";
import { clearGrades } from "@/lib/grade-storage";
import { disciplines } from "@/lib/data/disciplines";

/**
 * As notas na tela.
 *
 * O que estes testes guardam não é a aparência: é que a nota digitada no
 * pop-up chegue ao painel atrás dele. As quatro telas que mostram nota leem
 * o mesmo armazenamento por assinatura, e antes disso cada uma tinha a sua
 * cópia — anotar em uma deixava as outras mentindo.
 */

const fixtura = (id: string) => {
  const d = disciplines.find((x) => x.id === id)!;
  return { id: d.id, name: d.name, shortName: d.shortName, color: d.color, slug: d.slug };
};

beforeEach(() => clearGrades());

describe("o painel de notas", () => {
  it("não mostra conta nenhuma antes de haver nota", () => {
    render(<GradePanel disciplinas={[fixtura("mac-1")]} />);
    expect(screen.getByText(/nenhuma nota anotada/i)).toBeInTheDocument();
    expect(screen.queryByText(/média do semestre/i)).toBeNull();
  });

  it("leva ao painel a nota digitada no pop-up", async () => {
    const user = userEvent.setup({ delay: null });
    render(<GradePanel disciplinas={[fixtura("mac-1")]} />);

    await user.click(screen.getByRole("button", { name: /anotar notas/i }));

    const dialogo = screen.getByRole("dialog");
    expect(within(dialogo).getByText("Morfofuncional Aplicado à Clínica I")).toBeInTheDocument();

    // MAC I: formativa 1,0 + teórica 6,0 + teórico-prática 3,0 = 7,0 na N1.
    await user.type(within(dialogo).getByLabelText(/diagnóstica–formativa na N1/i), "1");
    await user.type(within(dialogo).getByLabelText(/prova teórica na N1/i), "4");
    await user.type(within(dialogo).getByLabelText(/teórico-prática na N1/i), "2");

    // A conta aparece dentro do pop-up…
    expect(
      within(dialogo).getByText("Precisa de 5,0 na N2 para fechar 6,0."),
    ).toBeInTheDocument();

    // …e também no painel atrás dele, que é o ponto.
    await user.click(within(dialogo).getByRole("button", { name: /^pronto$/i }));
    const linha = screen.getByRole("listitem");
    expect(within(linha).getByText("Precisa de 5,0 na N2 para fechar 6,0.")).toBeInTheDocument();
    expect(within(linha).getByText("7,0")).toBeInTheDocument();
  });

  it("recusa uma nota que não cabe na escala da parte", async () => {
    const user = userEvent.setup({ delay: null });
    render(<GradePanel disciplinas={[fixtura("mac-1")]} />);
    await user.click(screen.getByRole("button", { name: /anotar notas/i }));

    // A prova teórica de MAC I vale 6,0: 8 não cabe nela.
    const campo = screen.getByLabelText(/prova teórica na N1/i);
    await user.type(campo, "8");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("listitem")).toHaveTextContent(/nenhuma nota anotada/i);
  });

  it("guarda o que foi digitado depois de fechar e reabrir", async () => {
    const user = userEvent.setup({ delay: null });
    render(<GradePanel disciplinas={[fixtura("ha-1")]} />);
    await user.click(screen.getByRole("button", { name: /anotar notas/i }));
    await user.type(screen.getByLabelText(/osce na N1/i), "7,5");
    await user.click(screen.getByRole("button", { name: /fechar as notas/i }));

    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: /editar notas/i }));
    expect(screen.getByLabelText(/osce na N1/i)).toHaveValue("7,5");
  });
});

describe("as notas na página da matéria", () => {
  it("mostra as duas bimestrais e a parcial, e abre a mesma folha", async () => {
    const user = userEvent.setup({ delay: null });
    const mac = fixtura("mac-1");
    render(
      <DisciplineGrades disciplineId={mac.id} disciplineName={mac.name} color={mac.color} />,
    );

    expect(screen.getByText(/ainda não há nota anotada/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /anotar notas/i }));
    await user.type(screen.getByLabelText(/prova teórica na N1/i), "6");

    // A nota da bimestral não se forma com uma parte só: segue incompleta.
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    await user.type(screen.getByLabelText(/diagnóstica–formativa na N1/i), "1");
    await user.type(screen.getByLabelText(/teórico-prática na N1/i), "3");
    await user.click(screen.getByRole("button", { name: /^pronto$/i }));

    // N1 fechada em 10,0 — e a matéria já diz quanto basta na N2.
    expect(screen.getByText("10,0")).toBeInTheDocument();
    expect(screen.getByText(/precisa de 2,0 na N2/i)).toBeInTheDocument();
  });
});
