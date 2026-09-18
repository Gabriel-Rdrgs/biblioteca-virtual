import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { getStats } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Uso responsável",
  description:
    "Como o Atlas trata direitos autorais, acesso institucional, privacidade e material sensível.",
};

function Rule({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-line border-t py-7">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-ink-muted mt-2.5 space-y-3 text-[0.95rem] leading-relaxed text-pretty">
        {children}
      </div>
    </section>
  );
}

export default function ResponsibleUsePage() {
  const stats = getStats();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Uso responsável" }]} />
      <SectionHeading
        as="h1"
        title="Uso responsável"
        description="O Atlas existe para ajudar a turma a encontrar o que estudar — não para distribuir livros. Estas são as regras que o projeto segue."
      />

      <Rule title="O que o Atlas guarda">
        <p>
          O Atlas guarda <strong className="text-ink font-medium">metadados</strong>: título,
          autoria, editora, ano, edição, ISBN, tema e a relação com cada disciplina. Guarda também o
          trecho exato do plano de ensino de onde a referência foi transcrita, com seção e página,
          para que qualquer informação possa ser conferida na fonte.
        </p>
      </Rule>

      <Rule title="Livros sob direito autoral">
        <p>
          Os {stats.institutionalAccess} títulos licenciados aparecem no catálogo com a referência
          completa e um botão que leva à plataforma{" "}
          <strong className="text-ink font-medium">Minha Biblioteca</strong>, onde a leitura
          acontece com o seu login do UNIEURO.
        </p>
        <p>
          Nenhum desses arquivos é hospedado, copiado ou redistribuído pelo Atlas. Não há botão de
          download para eles, e isso é uma decisão de projeto, não uma limitação técnica.
        </p>
      </Rule>

      <Rule title="Planos de ensino">
        <p>
          Os {stats.teachingPlans} planos de ensino são documentos institucionais do curso,
          entregues à turma pela coordenação. Podem ser visualizados e baixados aqui.
        </p>
      </Rule>

      <Rule title="Referências sem arquivo">
        <p>
          Quando uma obra consta na bibliografia mas não tem link institucional nem arquivo
          autorizado, o Atlas mostra{" "}
          <em>“Referência catalogada — arquivo ainda não disponibilizado”</em>. A obra continua
          visível, porque saber que ela existe já é útil — mas o estado fica explícito, em vez de
          parecer um link quebrado.
        </p>
      </Rule>

      <Rule title="Materiais enviados por estudantes e professores">
        <p>
          Materiais próprios — resumos, roteiros, apostilas autorais — podem ser adicionados, desde
          que acompanhados da procedência e da autorização de quem os produziu. Cada item carrega um
          nível de acesso, que vai de público a restrito.
        </p>
        <p>
          Material questionado quanto à autoria ou à autorização pode ser removido imediatamente,
          sem necessidade de justificativa prévia.
        </p>
      </Rule>

      <Rule title="Dados de pacientes e informação sensível">
        <p>
          O Atlas <strong className="text-ink font-medium">não recebe</strong> prontuários, imagens
          de pacientes, laudos, exames identificáveis ou qualquer dado pessoal de terceiros. Casos
          clínicos usados em aula só entram anonimizados e com autorização docente.
        </p>
        <p>
          Isso vale mesmo para material de estudo: um caso real com nome, data de nascimento ou
          imagem reconhecível não deve ser enviado em nenhuma hipótese.
        </p>
      </Rule>

      <Rule title="Privacidade de quem usa">
        <p>
          O Atlas não pede cadastro nem coleta dados pessoais. Os livros que você salva ficam
          guardados apenas no seu próprio navegador e não são enviados a lugar nenhum.
        </p>
      </Rule>

      <Rule title="Erros e correções">
        <p>
          {stats.pendingReview} registros estão marcados como pendentes de revisão. São erros que
          vêm dos próprios planos de ensino — citações automáticas quebradas, grafias incorretas,
          links ausentes — e estão sinalizados no catálogo em vez de corrigidos em silêncio.
        </p>
        <p>
          Se encontrar um erro, avise: é melhor um registro marcado como duvidoso do que um registro
          errado com aparência de certo.
        </p>
      </Rule>

      <p className="border-line bg-surface-sunken text-ink-muted mt-10 rounded-[var(--radius-card)] border p-5 text-sm leading-relaxed">
        Dúvidas sobre acesso a um título específico devem ser encaminhadas à biblioteca do UNIEURO
        ou à coordenação do curso de Medicina.{" "}
        <Link href="/livros" className="text-primary hover:underline">
          Voltar ao catálogo
        </Link>
        .
      </p>
    </div>
  );
}
