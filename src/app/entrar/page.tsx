import type { Metadata } from "next";
import { AtlasMark } from "@/components/ui/atlas-mark";
import { gateConfigured } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string }>;
}) {
  const { proximo, erro } = await searchParams;
  const next = proximo && proximo.startsWith("/") ? proximo : "/";

  return (
    <div className="mx-auto flex min-h-[72vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="glass rounded-3xl p-7 sm:p-9">
        <AtlasMark className="text-primary size-9" />
        <h1 className="mt-5 text-3xl font-semibold">Oi, turma.</h1>
        <p className="text-ink-muted mt-2 leading-relaxed text-pretty">
          Aqui ficam os livros do semestre. Entra com a senha que combinamos em sala.
        </p>

        {!gateConfigured() ? (
          <p className="bg-accent-soft text-accent mt-6 rounded-2xl p-3 text-sm">
            A senha da turma ainda não foi configurada neste servidor, então o acesso está aberto.
          </p>
        ) : null}

        <form method="post" action="/api/entrar" className="mt-7 space-y-4">
          <input type="hidden" name="proximo" value={next} />
          <div>
            <label htmlFor="senha" className="block text-sm font-medium">
              Senha da turma
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              autoComplete="current-password"
              autoFocus
              aria-invalid={erro ? true : undefined}
              aria-describedby={erro ? "senha-erro" : undefined}
              className="glass-strong focus:border-primary mt-1.5 w-full rounded-full border border-transparent px-4 py-3 text-base outline-none"
            />
            {erro ? (
              <p id="senha-erro" className="text-danger mt-1.5 text-sm">
                Senha incorreta. Pergunta a alguém da turma.
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            className="bg-primary text-on-primary hover:bg-primary-hover w-full rounded-full px-4 py-3 text-sm font-semibold shadow-[var(--shadow-raise)] transition-colors"
          >
            Entrar
          </button>
        </form>

        <p className="text-ink-faint mt-6 text-xs leading-relaxed">
          Sem cadastro, sem dado pessoal. A sessão fica só neste aparelho, por 30 dias.
        </p>
      </div>
    </div>
  );
}
