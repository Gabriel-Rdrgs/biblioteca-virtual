import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/app-shell/header";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { Footer } from "@/components/app-shell/footer";
import { gateConfigured } from "@/lib/auth";

// Variable weight, so headings can use the full range; SOFT and WONK give
// Fraunces its editorial warmth.
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Atlas — Biblioteca Médica",
    template: "%s · Atlas",
  },
  description:
    "Biblioteca de referência da turma de Medicina do 1º período do UNIEURO. Livros, disciplinas e planos de ensino de 2026.2 em um só lugar.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f1" },
    { media: "(prefers-color-scheme: dark)", color: "#081720" },
  ],
};

/**
 * Applies the stored theme before first paint, so a reader who chose dark
 * never sees a flash of the ivory canvas.
 */
const themeScript = `
try {
  var t = localStorage.getItem('atlas-theme');
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gated = gateConfigured();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${fraunces.variable} ${inter.variable}`}>
        <a
          href="#conteudo"
          className="focus:bg-primary focus:text-on-primary sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
        >
          Pular para o conteúdo
        </a>

        <div className="ambient" aria-hidden="true" />
        <div className="flex min-h-dvh flex-col">
          {!gated ? (
            <p
              role="status"
              className="bg-accent-soft text-accent border-line border-b px-4 py-1.5 text-center text-xs font-medium"
            >
              Acesso aberto: a senha da turma (ATLAS_SENHA_TURMA) ainda não foi configurada.
            </p>
          ) : null}
          <Header gated={gated} />
          <main id="conteudo" className="flex-1 pt-2 pb-24 md:pb-4">
            {children}
          </main>
          <Footer />
        </div>

        <MobileNav />
      </body>
    </html>
  );
}
