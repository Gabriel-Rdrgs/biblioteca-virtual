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
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16">
      <AtlasMark className="text-primary size-9" />
      <h1 className="mt-5 text-3xl font-semibold">Biblioteca da turma</h1>
      <p className="text-ink-muted mt-2 leading-relaxed text-pretty">
        O Atlas é fechado para a turma de Medicina do 1º período do UNIEURO. Use a senha combinada
        em sala.
      </p>

      {!gateConfigured() ? (
        <p className="border-line bg-surface-sunken text-ink-muted mt-6 rounded-md border p-3 text-sm">
          A senha da turma ainda não foi configurada neste servidor, então o acesso está aberto.
          Defina <code className="font-mono text-xs">ATLAS_SENHA_TURMA</code> antes de publicar.
        </p>
      ) : null}

      <form method="post" action="/api/entrar" className="mt-8 space-y-4">
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
            className="border-line bg-surface focus:border-primary mt-1.5 w-full rounded-md border px-3 py-2.5 text-base"
          />
          {erro ? (
            <p id="senha-erro" role="alert" className="text-danger mt-1.5 text-sm">
              Senha incorreta. Confira com alguém da turma.
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          className="bg-primary text-on-primary hover:bg-primary-hover w-full rounded-md px-4 py-3 text-sm font-medium transition-colors"
        >
          Entrar
        </button>
      </form>

      <p className="text-ink-faint mt-8 text-xs leading-relaxed">
        Nenhum dado pessoal é coletado. A sessão fica guardada apenas neste navegador, por 30 dias.
      </p>
    </div>
  );
}
