import Link from "next/link";
import { AtlasMark } from "@/components/ui/atlas-mark";

export function Footer() {
  return (
    <footer className="border-line bg-surface-sunken mt-20 border-t">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <AtlasMark className="text-primary size-6" />
              <span className="font-display text-base font-semibold">Atlas</span>
            </div>
            <p className="text-ink-muted mt-3 text-sm leading-relaxed">
              Biblioteca de referência da turma de Medicina do 1º período do UNIEURO, montada a
              partir dos planos de ensino de 2026.2.
            </p>
          </div>

          <nav
            aria-label="Rodapé"
            className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:gap-x-16"
          >
            <Link href="/livros" className="text-ink-muted hover:text-primary">
              Todos os livros
            </Link>
            <Link href="/disciplinas" className="text-ink-muted hover:text-primary">
              Disciplinas
            </Link>
            <Link href="/planos-de-ensino" className="text-ink-muted hover:text-primary">
              Planos de ensino
            </Link>
            <Link href="/busca" className="text-ink-muted hover:text-primary">
              Busca
            </Link>
            <Link href="/uso-responsavel" className="text-ink-muted hover:text-primary">
              Uso responsável
            </Link>
          </nav>
        </div>

        <p className="border-line text-ink-faint mt-10 border-t pt-6 text-xs leading-relaxed">
          Biblioteca fechada para a turma. Os PDFs aqui postados são de uso interno, com origem e
          autorização registradas em cada arquivo — não redistribua fora do grupo. Livros sem
          arquivo aparecem como referência catalogada.{" "}
          <Link href="/uso-responsavel" className="hover:text-primary underline">
            Leia as regras de uso
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
