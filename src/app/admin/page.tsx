import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { BookTable, type AdminBookRow } from "@/components/admin/book-table";
import { NewBookForm } from "@/components/admin/new-book-form";
import { DisciplineForm } from "@/components/admin/discipline-form";
import { DisciplineTable, type AdminDisciplineRow } from "@/components/admin/discipline-table";
import { AssessmentManager } from "@/components/admin/assessment-manager";
import { SummaryForm } from "@/components/admin/summary-form";
import { SummaryTable, type AdminSummaryRow } from "@/components/admin/summary-table";
import { SectionHeading } from "@/components/ui/primitives";
import { readManifest } from "@/lib/catalog-store";
import { getAllAssessmentsForAdmin } from "@/lib/repository/assessments";
import { getExams } from "@/lib/repository/exams";
import { getAllSummariesForAdmin } from "@/lib/repository/summaries";
import { questionAreas } from "@/lib/data/questions";
import { assessmentLabel } from "@/lib/domain/assessment-types";
import { summaryLabel } from "@/lib/domain/summary-types";
import {
  getAllBooksForAdmin,
  getAllDisciplinesForAdmin,
  getCurrentPeriod,
  getDisciplines,
  getTeachingPlanForDiscipline,
} from "@/lib/repository";
import { storageMode } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Administração",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const actionLabels: Record<string, string> = {
  livro_criado: "Livro cadastrado",
  arquivo_anexado: "PDF anexado",
  arquivo_removido: "PDF removido",
  visibilidade: "Visibilidade alterada",
  registro_excluido: "Registro excluído",
  materia_criada: "Matéria criada",
  materia_editada: "Matéria editada",
  materia_visibilidade: "Matéria ocultada/mostrada",
  materia_excluida: "Matéria excluída",
  periodo_atual: "Período atual alterado",
  resumo_criado: "Resumo publicado",
  resumo_editado: "Resumo editado",
  resumo_excluido: "Resumo excluído",
  prova_criada: "Data de prova cadastrada",
  prova_editada: "Data de prova editada",
  prova_excluida: "Data de prova excluída",
};

export default async function AdminPage() {
  const [books, manifest, allDisciplines, currentPeriod] = await Promise.all([
    getAllBooksForAdmin(),
    readManifest(),
    getAllDisciplinesForAdmin(),
    getCurrentPeriod(),
  ]);
  const disciplineRows: AdminDisciplineRow[] = await Promise.all(
    allDisciplines.map(async (d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      shortName: d.shortName,
      period: d.period,
      semester: d.semester,
      visibility: d.visibility,
      origin: d.origin,
      hasPlan: Boolean(await getTeachingPlanForDiscipline(d.id)),
      bookCount: books.filter((b) => b.disciplines.some((x) => x.id === d.id)).length,
    })),
  );
  const assessments = await getAllAssessmentsForAdmin();
  const examOptions = getExams().map((exam) => ({
    id: exam.id,
    title: exam.title,
    disciplineId: exam.disciplineId,
  }));
  const latestSemester =
    [...allDisciplines].sort((x, y) => y.semester.localeCompare(x.semester))[0]?.semester ??
    "2027.1";

  const rows: AdminBookRow[] = books.map((book) => ({
    id: book.id,
    slug: book.slug,
    title: book.title,
    authors: book.authors,
    disciplines: book.disciplines.map((d) => d.shortName),
    visibility: book.visibility,
    hasFile: Boolean(book.file),
    ...(book.file ? { fileName: book.file.path, sizeBytes: book.file.sizeBytes } : {}),
    pending: book.provenance.reviewStatus === "pendente",
    fromPlan: book.provenance.sourceKind === "plano_de_ensino",
  }));

  const disciplines = (await getDisciplines()).map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    shortName: d.shortName,
    color: d.color,
    colorSoft: d.colorSoft,
    period: d.period,
  }));
  // Book form offers the current period's disciplines first.
  disciplines.sort(
    (x, y) =>
      Number(y.period === currentPeriod) - Number(x.period === currentPeriod) ||
      y.period - x.period,
  );

  const nomeDaMateria = new Map(allDisciplines.map((d) => [d.id, d.shortName]));
  const summaryRows: AdminSummaryRow[] = (await getAllSummariesForAdmin()).map((summary) => ({
    id: summary.id,
    slug: summary.slug,
    label: summaryLabel(summary),
    title: summary.title,
    discipline: nomeDaMateria.get(summary.disciplineId) ?? summary.disciplineId,
    pages: summary.pages,
    visibility: summary.visibility,
    origin: summary.origin,
  }));

  const withFile = rows.filter((r) => r.hasFile).length;
  const visible = rows.filter((r) => r.visibility === "visivel").length;
  const log = [...manifest.log].reverse().slice(0, 20);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-accent text-xs font-semibold tracking-[0.18em] uppercase">
            Administração
          </p>
          <h1 className="mt-1 text-3xl font-semibold">Acervo da turma</h1>
          <p className="text-ink-muted mt-2 max-w-2xl text-sm leading-relaxed">
            {rows.length} registros · {withFile} com PDF · {visible} visíveis para a turma. Arquivos
            em{" "}
            <code className="font-mono text-xs">
              {storageMode() === "r2" ? "Cloudflare R2" : "storage/livros (disco local)"}
            </code>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="border-line hover:border-line-strong rounded-control border px-3 py-2 text-sm"
          >
            Ver como a turma
          </Link>
          <form method="post" action="/api/admin/sair">
            <button
              type="submit"
              className="border-line hover:border-line-strong rounded-control inline-flex items-center gap-1.5 border px-3 py-2 text-sm"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sair do admin
            </button>
          </form>
        </div>
      </div>

      <section className="mt-12">
        <SectionHeading
          numeral="I"
          title="Publicar um livro novo"
          description="Envie o PDF, preencha a ficha, escolha as disciplinas e registre origem e autorização. O livro aparece para a turma assim que for salvo."
        />
        <div className="border-line bg-surface rounded-card border p-5 sm:p-6">
          <NewBookForm disciplines={disciplines} />
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          numeral="II"
          title="Matérias e períodos"
          description="Cadastre as matérias de um novo período, oculte as que não interessam e diga em que período a turma está."
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="glass rounded-hero p-5 sm:p-6">
            <h3 className="mb-4 text-sm font-semibold">Nova matéria</h3>
            <DisciplineForm defaultSemester={latestSemester} />
          </div>
          <DisciplineTable rows={disciplineRows} currentPeriod={currentPeriod} />
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          numeral="III"
          title="Calendário de provas"
          description="As datas não vêm do plano de ensino e mudam no semestre: são as únicas informações da biblioteca que só uma pessoa pode preencher."
        />
        <AssessmentManager
          assessments={assessments}
          disciplines={allDisciplines
            .filter((d) => d.visibility === "visivel")
            .map((d) => ({ id: d.id, name: d.name }))}
          exams={examOptions}
        />
      </section>

      <section className="mt-14">
        <SectionHeading
          numeral="IV"
          title="Resumos da turma"
          description="Publique o resumo de uma aula, de um problema de tutoria ou o apanhado de uma prova. O PDF sobe como o dos livros; o que o liga ao resto são a matéria, a avaliação e os eixos do banco."
        />
        <div className="border-line bg-surface rounded-card border p-5 sm:p-6">
          <SummaryForm
            disciplines={allDisciplines
              .filter((d) => d.visibility === "visivel")
              .map((d) => ({ id: d.id, name: d.name }))}
            assessments={assessments.map((a) => ({
              id: a.id,
              disciplineId: a.disciplineId,
              label: assessmentLabel(a),
            }))}
            areas={questionAreas.map((area) => ({
              id: area.id,
              label: area.label,
              axes: area.axes.map((axis) => ({ id: axis.id, label: axis.label })),
            }))}
          />
        </div>
        <div className="mt-6">
          <SummaryTable rows={summaryRows} />
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          numeral="V"
          title="Todos os livros"
          description="Livros dos planos de ensino e do acervo da turma. Anexe um PDF a um registro sem arquivo, oculte ou mostre, ou substitua o arquivo."
        />
        <BookTable rows={rows} />
      </section>

      <section className="mt-14">
        <SectionHeading numeral="VI" title="Últimas alterações" />
        {log.length === 0 ? (
          <p className="text-ink-muted text-sm">Nenhuma alteração registrada ainda.</p>
        ) : (
          <ol className="divide-line border-line rounded-control divide-y border text-sm">
            {log.map((entry, i) => (
              <li key={`${entry.at}-${i}`} className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2.5">
                <time dateTime={entry.at} className="text-ink-faint tabular-nums">
                  {new Date(entry.at).toLocaleString("pt-BR")}
                </time>
                <span className="font-medium">{actionLabels[entry.action] ?? entry.action}</span>
                <span className="text-ink-muted">{entry.bookId}</span>
                {entry.detail ? <span className="text-ink-faint">{entry.detail}</span> : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
