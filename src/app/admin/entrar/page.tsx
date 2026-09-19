import type { Metadata } from "next";
import { AtlasMark } from "@/components/ui/atlas-mark";

export const metadata: Metadata = {
  title: "Administração — entrar",
  robots: { index: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string }>;
}) {
  const { proximo, erro } = await searchParams;
  const next = proximo && proximo.startsWith("/") ? proximo : "/admin";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16">
      <AtlasMark className="text-accent size-9" />
      <h1 className="mt-5 text-3xl font-semibold">Administração</h1>
      <p className="text-ink-muted mt-2 leading-relaxed text-pretty">
        Área para publicar PDFs, cadastrar livros e controlar o que a turma vê. A senha é diferente
        da senha da turma.
      </p>

      <form method="post" action="/api/admin/entrar" className="mt-8 space-y-4">
        <input type="hidden" name="proximo" value={next} />
        <div>
          <label htmlFor="senha" className="block text-sm font-medium">
            Senha de administração
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
            <p id="senha-erro" className="text-danger mt-1.5 text-sm">
              Senha incorreta.
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          className="bg-accent text-on-primary w-full rounded-md px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90"
        >
          Entrar como administrador
        </button>
      </form>

      <p className="text-ink-faint mt-8 text-xs leading-relaxed">
        A sessão administrativa dura um dia e fica só neste navegador.
      </p>
    </div>
  );
}
