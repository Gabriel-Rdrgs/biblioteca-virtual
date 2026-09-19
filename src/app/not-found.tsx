import Link from "next/link";
import { AtlasMark } from "@/components/ui/atlas-mark";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <AtlasMark className="text-ink-faint size-10" />
      <p className="text-ink-faint mt-6 text-xs font-medium tracking-[0.2em] uppercase">
        Página não encontrada
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Isso não está no acervo.</h1>
      <p className="text-ink-muted mt-3 leading-relaxed text-pretty">
        O endereço pode estar errado, ou o item foi ocultado do catálogo da turma.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/livros"
          className="bg-primary text-on-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          Ver os livros
        </Link>
        <Link href="/busca" className="border-line rounded-md border px-4 py-2 text-sm font-medium">
          Buscar
        </Link>
      </div>
    </div>
  );
}
