/**
 * Desenha as figuras dos simulados de IC I e AES 2.
 *
 * Rode com `npm run draw:figuras`. As figuras saem em storage/simulados,
 * que não é versionado — este arquivo é que é a fonte delas.
 *
 * O caderno impresso traz figuras originais, em vetor. Em vez de tentar
 * arrancar bitmaps do PDF, elas são redesenhadas aqui: ficam nítidas em
 * qualquer zoom, pesam alguns KB e os números que as questões citam são
 * texto de verdade.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "storage",
  "simulados",
);

const NAVY = "#1f2d50";
const GOLD = "#c08a2e";
const RED = "#b3332e";
const GREEN = "#2e7d4f";
const INK = "#2b3242";
const MUTED = "#6b7280";
const LINE = "#c9c3b6";
const CREAM = "#f1ece1";
const PAPER = "#ffffff";
const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const rad = (deg) => (deg * Math.PI) / 180;
const n = (v) => Math.round(v * 100) / 100;

function doc(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="${FONT}">
<defs>
<marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
<path d="M0 0 L10 5 L0 10 z" fill="${NAVY}"/>
</marker>
</defs>
<rect width="${w}" height="${h}" fill="${PAPER}"/>
${body}
</svg>
`;
}

const txt = (x, y, s, o = {}) =>
  `<text x="${n(x)}" y="${n(y)}" font-size="${o.size || 11}" fill="${o.fill || INK}" text-anchor="${o.anchor || "middle"}"${o.weight ? ` font-weight="${o.weight}"` : ""}${o.style ? ` font-style="${o.style}"` : ""}>${s}</text>`;

/** Caixinha numerada — é por ela que o enunciado se refere ao elemento. */
function badge(x, y, num) {
  return `<rect x="${n(x - 9)}" y="${n(y - 9)}" width="18" height="18" rx="4" fill="${PAPER}" stroke="${NAVY}" stroke-width="1.2"/>${txt(x, y + 4, num, { size: 11, weight: "700", fill: NAVY })}`;
}

const box = (x, y, w, h, o = {}) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${o.rx ?? 5}" fill="${o.fill || CREAM}" stroke="${o.stroke || LINE}" stroke-width="1"/>`;

const arrow = (x1, y1, x2, y2) =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${NAVY}" stroke-width="1.3" marker-end="url(#seta)"/>`;

const lines = (x, y, arr, o = {}) => arr.map((s, i) => txt(x, y + i * (o.lh || 12), s, o)).join("");

const write = (name, svg) => {
  fs.writeFileSync(path.join(OUT, name), svg, "utf8");
  console.log(name, svg.length, "bytes");
};

// ---------------------------------------------------------------- figura 1
// Ciclo da investigação científica: seis etapas numeradas.
{
  const w = 560,
    h = 420,
    cx = 280,
    cy = 205,
    R = 140,
    r = 34;
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = rad(-90 + 60 * i);
    pts.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  }
  let s = "";
  for (let i = 0; i < 6; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 6];
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len,
      uy = dy / len;
    s += arrow(a.x + ux * (r + 7), a.y + uy * (r + 7), b.x - ux * (r + 11), b.y - uy * (r + 11));
  }
  for (let i = 0; i < 6; i++) {
    const p = pts[i];
    s += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${r}" fill="${CREAM}" stroke="${NAVY}" stroke-width="1.4"/>`;
    s += txt(p.x, p.y + 10, String(i + 1), { size: 26, weight: "700", fill: NAVY });
  }
  s += txt(cx, cy - 4, "novas", { size: 11, fill: MUTED });
  s += txt(cx, cy + 10, "perguntas", { size: 11, fill: MUTED });
  s += txt(cx, 404, "o ciclo recomeça a cada resposta", { size: 11, fill: MUTED });
  write("ic-fig-01.svg", doc(w, h, s));
}

// ---------------------------------------------------------------- figura 2
// Pirâmide de evidências, sete níveis numerados do topo para a base.
{
  const w = 560,
    h = 400;
  const apexX = 230,
    apexY = 28,
    baseY = 352,
    halfBase = 200;
  const tones = ["#1b2746", "#2b3c6b", "#43558c", "#6a7aa8", "#9aa4c2", "#cfc6b0", "#ece6d8"];
  let s = "";
  const yAt = (i) => apexY + (i * (baseY - apexY)) / 7;
  const halfAt = (y) => ((y - apexY) / (baseY - apexY)) * halfBase;
  for (let i = 0; i < 7; i++) {
    const y1 = yAt(i),
      y2 = yAt(i + 1);
    const h1 = halfAt(y1),
      h2 = halfAt(y2);
    s += `<polygon points="${n(apexX - h1)},${n(y1)} ${n(apexX + h1)},${n(y1)} ${n(apexX + h2)},${n(y2)} ${n(apexX - h2)},${n(y2)}" fill="${tones[i]}" stroke="${PAPER}" stroke-width="1.5"/>`;
    const my = (y1 + y2) / 2;
    s += `<line x1="${n(apexX + halfAt(my))}" y1="${n(my)}" x2="470" y2="${n(my)}" stroke="${LINE}" stroke-width="1"/>`;
    s += badge(486, my, String(i + 1));
  }
  s += txt(280, 380, "maior capacidade de controlar vieses no topo", { size: 11, fill: MUTED });
  write("ic-fig-02.svg", doc(w, h, s));
}

// ---------------------------------------------------------------- figura 3
// Coorte (A) e caso-controle (B): o traço vermelho marca o início do estudo.
{
  const w = 560,
    h = 330;
  let s = "";
  // A — coorte
  s += txt(22, 28, "A", { size: 13, weight: "700", anchor: "start" });
  s += box(30, 48, 118, 42);
  s += lines(89, 65, ["Pessoas sem", "a doença"], { size: 10 });
  s += box(196, 30, 104, 28) + txt(248, 48, "Expostos", { size: 10 });
  s += box(196, 80, 104, 28) + txt(248, 98, "Não expostos", { size: 10 });
  s += arrow(148, 62, 194, 46);
  s += arrow(148, 76, 194, 92);
  const outs = [
    [20, "Doença +"],
    [48, "Doença −"],
    [78, "Doença +"],
    [106, "Doença −"],
  ];
  outs.forEach(([y, label], i) => {
    s += box(352, y, 84, 24) + txt(394, y + 16, label, { size: 10 });
    s += arrow(300, i < 2 ? 44 : 94, 350, y + 12);
  });
  s += `<line x1="30" y1="140" x2="470" y2="140" stroke="${MUTED}" stroke-width="1" marker-end="url(#seta)"/>`;
  s += `<line x1="128" y1="132" x2="128" y2="148" stroke="${RED}" stroke-width="2"/>`;
  s += txt(30, 158, "início do estudo", { size: 9, fill: MUTED, anchor: "start" });
  s += txt(470, 158, "tempo", { size: 9, fill: MUTED, anchor: "end" });

  // B — caso-controle
  s += txt(22, 190, "B", { size: 13, weight: "700", anchor: "start" });
  s += box(352, 186, 104, 36) + lines(404, 202, ["Com a doença"], { size: 10 });
  s += box(352, 248, 104, 36) + lines(404, 264, ["Sem a doença"], { size: 10 });
  const exps = [
    [182, "Exposição: sim"],
    [210, "Exposição: não"],
    [244, "Exposição: sim"],
    [272, "Exposição: não"],
  ];
  exps.forEach(([y, label], i) => {
    s += box(120, y, 104, 24) + txt(172, y + 16, label, { size: 10 });
    s += arrow(350, i < 2 ? 204 : 266, 226, y + 12);
  });
  s += `<line x1="470" y1="306" x2="30" y2="306" stroke="${MUTED}" stroke-width="1" marker-end="url(#seta)"/>`;
  s += `<line x1="404" y1="298" x2="404" y2="314" stroke="${RED}" stroke-width="2"/>`;
  s += txt(30, 324, "passado", { size: 9, fill: MUTED, anchor: "start" });
  s += txt(470, 324, "início do estudo", { size: 9, fill: MUTED, anchor: "end" });
  write("ic-fig-03.svg", doc(w, h, s));
}

// ---------------------------------------------------------------- figura 4
// Ensaio clínico randomizado, seis etapas numeradas.
{
  const w = 600,
    h = 250;
  let s = "";
  s += box(28, 78, 112, 70, { fill: CREAM });
  let dots = "";
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 9; c++)
      dots += `<circle cx="${n(42 + c * 11)}" cy="${n(92 + r * 9)}" r="2.6" fill="${NAVY}"/>`;
  s += dots + txt(84, 142, "n = 1.200", { size: 10, fill: MUTED });
  s += badge(34, 72, "1");

  s +=
    `<circle cx="196" cy="113" r="21" fill="${NAVY}"/>` +
    txt(196, 118, "R", { size: 15, weight: "700", fill: PAPER });
  s += badge(196, 82, "2");
  s += arrow(142, 113, 173, 113);

  s += box(258, 38, 124, 52);
  s += lines(320, 58, ["cápsula com", "vitamina D"], { size: 10 });
  s += txt(320, 82, "n = 600", { size: 9, fill: MUTED });
  s += badge(264, 32, "3");

  s += box(258, 142, 124, 56);
  s += lines(320, 160, ["cápsula idêntica,", "sem princípio ativo"], { size: 10 });
  s += txt(320, 190, "n = 600", { size: 9, fill: MUTED });
  s += badge(264, 136, "4");

  s += arrow(216, 100, 256, 66);
  s += arrow(216, 128, 256, 162);

  s += box(410, 92, 48, 44, { fill: "#f6eeee", stroke: RED });
  s += `<circle cx="434" cy="112" r="11" fill="none" stroke="${RED}" stroke-width="1.6"/>`;
  s += `<circle cx="434" cy="112" r="4" fill="${RED}"/>`;
  s += `<line x1="422" y1="124" x2="446" y2="100" stroke="${RED}" stroke-width="2"/>`;
  s += badge(416, 86, "5");
  s += arrow(384, 70, 410, 102);
  s += arrow(384, 166, 410, 128);

  s += box(492, 88, 84, 52);
  s += lines(534, 108, ["quedas em", "24 meses"], { size: 10 });
  s += badge(498, 82, "6");
  s += arrow(460, 114, 490, 114);
  write("ic-fig-04.svg", doc(w, h, s));
}

// ---------------------------------------------------------------- figura 5
// Forest plot com seis ensaios e a estimativa combinada.
{
  const w = 620,
    h = 300;
  const x0 = 180,
    x1 = 430;
  const xOf = (v) => x0 + ((Math.log2(v) + 2) / 4) * (x1 - x0);
  const studies = [
    ["Estudo A", 0.7, 0.5, 0.98, 18],
    ["Estudo B", 0.92, 0.65, 1.3, 15],
    ["Estudo C", 0.75, 0.58, 0.97, 24],
    ["Estudo D", 1.1, 0.7, 1.73, 9],
    ["Estudo E", 0.78, 0.6, 1.01, 22],
    ["Estudo F", 0.65, 0.38, 1.11, 12],
  ];
  let s = "";
  s += txt(26, 36, "Estudo", { size: 10, fill: MUTED, anchor: "start" });
  s += txt(305, 36, "Risco relativo (IC 95%)", { size: 10, fill: MUTED });
  s += txt(470, 36, "RR [IC 95%]", { size: 10, fill: MUTED, anchor: "start" });
  s += txt(596, 36, "Peso", { size: 10, fill: MUTED, anchor: "end" });
  s += `<line x1="26" y1="44" x2="596" y2="44" stroke="${LINE}" stroke-width="1"/>`;
  s += `<line x1="${n(xOf(1))}" y1="52" x2="${n(xOf(1))}" y2="236" stroke="${NAVY}" stroke-width="1" stroke-dasharray="4 3"/>`;

  studies.forEach(([name, rr, lo, hi, peso], i) => {
    const y = 68 + i * 26;
    const side = 5 + peso * 0.38;
    s += txt(26, y + 4, name, { size: 10, anchor: "start" });
    s += `<line x1="${n(xOf(lo))}" y1="${n(y)}" x2="${n(xOf(hi))}" y2="${n(y)}" stroke="${NAVY}" stroke-width="1.2"/>`;
    s += `<rect x="${n(xOf(rr) - side / 2)}" y="${n(y - side / 2)}" width="${n(side)}" height="${n(side)}" fill="${NAVY}"/>`;
    s += txt(
      470,
      y + 4,
      `${rr.toFixed(2).replace(".", ",")} [${lo.toFixed(2).replace(".", ",")}; ${hi.toFixed(2).replace(".", ",")}]`,
      { size: 10, anchor: "start" },
    );
    s += txt(596, y + 4, `${peso}%`, { size: 10, anchor: "end" });
  });

  // combinada
  const cy = 236;
  const c = [0.78, 0.69, 0.89];
  s += txt(26, cy + 4, "Combinado", { size: 10, weight: "700", anchor: "start" });
  s += `<polygon points="${n(xOf(c[1]))},${cy} ${n(xOf(c[0]))},${cy - 8} ${n(xOf(c[2]))},${cy} ${n(xOf(c[0]))},${cy + 8}" fill="${GOLD}" stroke="${NAVY}" stroke-width="1"/>`;
  s += txt(470, cy + 4, "0,78 [0,69; 0,89]", { size: 10, weight: "700", anchor: "start" });
  s += txt(596, cy + 4, "100%", { size: 10, weight: "700", anchor: "end" });
  s += txt(26, cy + 20, "Heterogeneidade: I² = 12%", { size: 9, fill: MUTED, anchor: "start" });

  // eixo
  s += `<line x1="${n(xOf(0.25))}" y1="258" x2="${n(xOf(4))}" y2="258" stroke="${MUTED}" stroke-width="1"/>`;
  [0.25, 0.5, 1, 2, 4].forEach((v) => {
    s += `<line x1="${n(xOf(v))}" y1="258" x2="${n(xOf(v))}" y2="263" stroke="${MUTED}" stroke-width="1"/>`;
    s += txt(xOf(v), 274, String(v).replace(".", ","), { size: 9, fill: MUTED });
  });
  s += txt(xOf(0.5), 288, "favorece a intervenção", { size: 9, fill: MUTED });
  s += txt(xOf(2), 288, "favorece o controle", { size: 9, fill: MUTED });

  // números do enunciado
  s += badge(xOf(0.7) - 22, 60, "1");
  s += `<line x1="${n(xOf(0.7) - 14)}" y1="62" x2="${n(xOf(0.7) - 3)}" y2="66" stroke="${LINE}"/>`;
  s += badge(xOf(1.73) + 20, 146, "2");
  s += `<line x1="${n(xOf(1.73) + 11)}" y1="146" x2="${n(xOf(1.73))}" y2="146" stroke="${LINE}"/>`;
  s += badge(xOf(1) + 24, 56, "3");
  s += `<line x1="${n(xOf(1) + 15)}" y1="56" x2="${n(xOf(1))}" y2="56" stroke="${LINE}"/>`;
  s += badge(xOf(0.89) + 26, cy, "4");
  s += `<line x1="${n(xOf(0.89) + 17)}" y1="${cy}" x2="${n(xOf(0.89) + 2)}" y2="${cy}" stroke="${LINE}"/>`;
  write("ic-fig-05.svg", doc(w, h, s));
}

// ---------------------------------------------------------------- figura 6
// Trâmite de um projeto com seres humanos.
{
  const w = 560,
    h = 280;
  let s = "";
  const nodes = [
    [24, 60, "pesquisador", "projeto e TCLE"],
    [134, 60, "submissão", "Plataforma Brasil"],
    [244, 60, "CEP", "análise"],
    [354, 60, "parecer", "aprovado · pendente"],
    [460, 60, "coleta", "e relatórios"],
  ];
  const bw = 86,
    bh = 56;
  nodes.forEach(([x, y, t1, t2], i) => {
    s += box(x, y, bw, bh);
    s += txt(x + bw / 2, y + 24, t1, { size: 11, weight: "600" });
    s += txt(x + bw / 2, y + 40, t2, { size: 9, fill: MUTED });
    s += badge(x + 6, y - 6, String(i < 3 ? i + 1 : i + 2));
  });
  [0, 1, 2, 3].forEach((i) => {
    const x = nodes[i][0] + bw;
    s += arrow(x + 2, 88, nodes[i + 1][0] - 2, 88);
  });
  // CONEP, quando exigido
  s += box(244, 178, 86, 50, { fill: "#f6f1e6", stroke: GOLD });
  s += txt(287, 200, "CONEP", { size: 11, weight: "600" });
  s += txt(287, 216, "área temática", { size: 9, fill: MUTED });
  s += badge(250, 172, "4");
  s += `<line x1="287" y1="118" x2="287" y2="174" stroke="${GOLD}" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#seta)"/>`;
  s += txt(300, 146, "quando exigido", { size: 9, fill: MUTED, anchor: "start" });
  s += `<path d="M330 200 L397 200 L397 120" fill="none" stroke="${GOLD}" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#seta)"/>`;
  // retorno
  s += `<path d="M503 118 L503 252 L67 252 L67 120" fill="none" stroke="${LINE}" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#seta)"/>`;
  s += txt(285, 266, "relatórios parciais e final", { size: 9, fill: MUTED });
  s += txt(280, 32, "a coleta só começa depois do parecer de aprovação", { size: 10, fill: MUTED });
  write("ic-fig-06.svg", doc(w, h, s));
}

// ---------------------------------------------------------------- figura 7
// Os três componentes da MBE.
{
  const w = 420,
    h = 360;
  const r = 96;
  const c1 = [210, 126],
    c2 = [156, 226],
    c3 = [264, 226];
  let s = "";
  s += `<circle cx="${c1[0]}" cy="${c1[1]}" r="${r}" fill="${NAVY}" fill-opacity="0.12" stroke="${NAVY}" stroke-width="1.2"/>`;
  s += `<circle cx="${c2[0]}" cy="${c2[1]}" r="${r}" fill="${GOLD}" fill-opacity="0.16" stroke="${GOLD}" stroke-width="1.2"/>`;
  s += `<circle cx="${c3[0]}" cy="${c3[1]}" r="${r}" fill="${RED}" fill-opacity="0.12" stroke="${RED}" stroke-width="1.2"/>`;
  s += lines(210, 66, ["Melhor evidência", "disponível"], { size: 11, weight: "600" });
  s += badge(210, 40, "1");
  s += lines(104, 268, ["Experiência", "clínica"], { size: 11, weight: "600" });
  s += badge(104, 242, "2");
  s += lines(318, 262, ["Valores e", "preferências", "do paciente"], { size: 11, weight: "600" });
  s += badge(318, 236, "3");
  const star = (cx, cy, rr) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = rad(-90 + i * 36);
      const rad2 = i % 2 === 0 ? rr : rr * 0.45;
      pts.push(`${n(cx + rad2 * Math.cos(a))},${n(cy + rad2 * Math.sin(a))}`);
    }
    return `<polygon points="${pts.join(" ")}" fill="${NAVY}"/>`;
  };
  s += star(210, 193, 15);
  s += txt(210, 334, "★ decisão clínica compartilhada", { size: 10, fill: MUTED });
  write("ic-fig-07.svg", doc(w, h, s));
}

// ---------------------------------------------------------------- figura 8
// Tabela 2 × 2 dos casos de infarto.
{
  const w = 480,
    h = 180;
  const cols = [20, 170, 272, 374, 460];
  const rows = [30, 66, 102, 138];
  let s = "";
  s += `<rect x="20" y="30" width="440" height="108" fill="${PAPER}" stroke="${LINE}"/>`;
  s += `<rect x="20" y="30" width="440" height="36" fill="${CREAM}"/>`;
  s += `<rect x="20" y="30" width="150" height="108" fill="${CREAM}"/>`;
  cols.forEach((x) => {
    s += `<line x1="${x}" y1="30" x2="${x}" y2="138" stroke="${LINE}"/>`;
  });
  rows.forEach((y) => {
    s += `<line x1="20" y1="${y}" x2="460" y2="${y}" stroke="${LINE}"/>`;
  });
  const headers = ["", "IAM: sim", "IAM: não", "Total"];
  headers.forEach((t, i) => {
    if (t) s += txt((cols[i] + cols[i + 1]) / 2, 53, t, { size: 11, weight: "700" });
  });
  const body = [
    ["Fumantes", "30", "970", "1.000"],
    ["Não fumantes", "10", "990", "1.000"],
  ];
  body.forEach((row, ri) => {
    const y = rows[ri + 1] + 23;
    row.forEach((t, ci) => {
      s += txt((cols[ci] + cols[ci + 1]) / 2, y, t, {
        size: 11,
        weight: ci === 0 ? "700" : "400",
      });
    });
  });
  s += txt(240, 162, "coorte de 10 anos; 1.000 pessoas em cada grupo", { size: 9, fill: MUTED });
  write("ic-fig-08.svg", doc(w, h, s));
}

// ---------------------------------------------------------------- figura 9
// Três estratégias de busca com A e B.
{
  const w = 560,
    h = 220;
  const groups = [110, 280, 450];
  const cy = 92,
    r = 46,
    off = 26;
  let s = "";
  groups.forEach((gx, i) => {
    const ax = gx - off,
      bx = gx + off;
    const idA = `a${i}`,
      idB = `b${i}`;
    s += `<defs><clipPath id="${idA}"><circle cx="${ax}" cy="${cy}" r="${r}"/></clipPath><clipPath id="${idB}"><circle cx="${bx}" cy="${cy}" r="${r}"/></clipPath></defs>`;
    if (i === 0) {
      s += `<g clip-path="url(#${idA})"><circle cx="${bx}" cy="${cy}" r="${r}" fill="${GOLD}"/></g>`;
    } else if (i === 1) {
      s += `<circle cx="${ax}" cy="${cy}" r="${r}" fill="${GOLD}"/><circle cx="${bx}" cy="${cy}" r="${r}" fill="${GOLD}"/>`;
    } else {
      s += `<circle cx="${ax}" cy="${cy}" r="${r}" fill="${GOLD}"/>`;
      s += `<g clip-path="url(#${idA})"><circle cx="${bx}" cy="${cy}" r="${r}" fill="${PAPER}"/></g>`;
    }
    s += `<circle cx="${ax}" cy="${cy}" r="${r}" fill="none" stroke="${NAVY}" stroke-width="1.2"/>`;
    s += `<circle cx="${bx}" cy="${cy}" r="${r}" fill="none" stroke="${NAVY}" stroke-width="1.2"/>`;
    s += txt(ax - 22, cy + 4, "A", { size: 13, weight: "700" });
    s += txt(bx + 22, cy + 4, "B", { size: 13, weight: "700" });
    s += badge(gx, 176, String(i + 1));
  });
  s += txt(280, 30, "em destaque, os artigos recuperados", { size: 10, fill: MUTED });
  write("ic-fig-09.svg", doc(w, h, s));
}

// ---------------------------------------------------------------- figura 10
// Gráfico de funil com o canto vazio.
{
  const w = 480,
    h = 360;
  let s = "";
  const apex = [256, 46],
    bl = [96, 300],
    br = [416, 300];
  s += `<polygon points="${apex[0]},${apex[1]} ${br[0]},${br[1]} ${bl[0]},${bl[1]}" fill="none" stroke="${NAVY}" stroke-width="1.1"/>`;
  s += `<line x1="256" y1="42" x2="256" y2="304" stroke="${NAVY}" stroke-width="1" stroke-dasharray="4 3"/>`;
  s += `<line x1="70" y1="304" x2="446" y2="304" stroke="${MUTED}" stroke-width="1"/>`;
  s += `<line x1="70" y1="304" x2="70" y2="40" stroke="${MUTED}" stroke-width="1"/>`;
  const dots = [
    [252, 62],
    [262, 70],
    [244, 78],
    [268, 86],
    [238, 96],
    [272, 100],
    [230, 112],
    [280, 116],
    [248, 124],
    [266, 130],
    [222, 140],
    [286, 146],
    [240, 152],
    [274, 158],
    [210, 170],
    [292, 176],
    [232, 186],
    [262, 192],
    [196, 208],
    [250, 214],
    [180, 236],
    [226, 244],
    [164, 262],
    [208, 270],
  ];
  dots.forEach(([x, y]) => {
    s += `<circle cx="${x}" cy="${y}" r="4.2" fill="${NAVY}" fill-opacity="0.85"/>`;
  });
  s += `<rect x="304" y="212" width="98" height="80" fill="none" stroke="${RED}" stroke-width="1.4" stroke-dasharray="5 4"/>`;
  s += txt(353, 260, "?", { size: 26, weight: "700", fill: RED });
  s += txt(256, 326, "tamanho do efeito (OR, escala log) · à esquerda: benefício", {
    size: 9,
    fill: MUTED,
  });
  s += `<text x="-170" y="56" font-size="9" fill="${MUTED}" text-anchor="middle" transform="rotate(-90)">precisão (estudos maiores ↑)</text>`;
  write("ic-fig-10.svg", doc(w, h, s));
}

// ---------------------------------------------------------------- figura 11
// RoB 2: cinco domínios e o julgamento global.
{
  const w = 560,
    h = 260;
  let s = "";
  const colX = [130, 196, 262, 328, 394, 480];
  const heads = ["D1", "D2", "D3", "D4", "D5", "Global"];
  heads.forEach((t, i) => (s += txt(colX[i], 44, t, { size: 11, weight: "700" })));
  const rows = [
    ["Estudo 1", ["+", "+", "+", "+", "+"], "+"],
    ["Estudo 2", ["-", "+", "+", "+", "+"], "?"],
    ["Estudo 3", ["+", "!", "+", "!", "+"], "!"],
  ];
  const paint = { "+": GREEN, "!": GOLD, "-": RED, "?": PAPER };
  rows.forEach(([name, ds, global], ri) => {
    const y = 78 + ri * 44;
    s += txt(24, y + 4, name, { size: 11, anchor: "start" });
    [...ds, global].forEach((v, ci) => {
      const fill = paint[v];
      const isGlobal = ci === 5;
      s += `<circle cx="${colX[ci]}" cy="${y}" r="13" fill="${fill}" stroke="${v === "?" ? MUTED : fill}" stroke-width="1.4"${isGlobal && v === "?" ? ' stroke-dasharray="3 2"' : ""}/>`;
      s += txt(colX[ci], y + 5, v === "-" ? "−" : v, {
        size: 14,
        weight: "700",
        fill: v === "?" ? MUTED : PAPER,
      });
    });
  });
  const legend = [
    ["D1 processo de randomização", 206],
    ["D2 desvios das intervenções pretendidas", 220],
    ["D3 dados faltantes do desfecho", 234],
    ["D4 mensuração do desfecho", 248],
  ];
  legend.forEach(([t, y]) => (s += txt(24, y, t, { size: 9, fill: MUTED, anchor: "start" })));
  s += txt(300, 206, "D5 seleção do resultado relatado", { size: 9, fill: MUTED, anchor: "start" });
  s += txt(300, 220, "+ baixo   ! algumas preocupações   − alto", {
    size: 9,
    fill: MUTED,
    anchor: "start",
  });
  write("ic-fig-11.svg", doc(w, h, s));
}

// ---------------------------------------------------------------- figura 12
// Linha do tempo da ética em pesquisa.
{
  const w = 620,
    h = 180;
  const xOf = (year) => 60 + ((year - 1940) / 90) * 500;
  const marks = [
    [1947, 1, -1],
    [1964, 2, 1],
    [1979, 3, -1],
    [2012, 4, 1],
    [2024, 5, -1],
  ];
  let s = "";
  s += `<line x1="40" y1="92" x2="590" y2="92" stroke="${NAVY}" stroke-width="1.4" marker-end="url(#seta)"/>`;
  marks.forEach(([year, num, dir]) => {
    const x = xOf(year);
    s += `<circle cx="${n(x)}" cy="92" r="5" fill="${RED}"/>`;
    const y = dir === -1 ? 54 : 130;
    s += `<line x1="${n(x)}" y1="${dir === -1 ? 86 : 98}" x2="${n(x)}" y2="${dir === -1 ? y + 10 : y - 10}" stroke="${LINE}"/>`;
    s += badge(x, y, String(num));
    s += txt(x, dir === -1 ? y - 16 : y + 24, String(year), { size: 11, weight: "600" });
  });
  s += txt(310, 168, "cinco marcos, do pós-guerra à lei brasileira em vigor", {
    size: 9,
    fill: MUTED,
  });
  write("ic-fig-12.svg", doc(w, h, s));
}

// ------------------------------------------------------- AES 2 · figura 1
// Código genético, para a questão que manda consultá-lo.
{
  const w = 640,
    h = 440;
  const table = {
    UUU: "Phe",
    UUC: "Phe",
    UUA: "Leu",
    UUG: "Leu",
    UCU: "Ser",
    UCC: "Ser",
    UCA: "Ser",
    UCG: "Ser",
    UAU: "Tyr",
    UAC: "Tyr",
    UAA: "Parada",
    UAG: "Parada",
    UGU: "Cys",
    UGC: "Cys",
    UGA: "Parada",
    UGG: "Trp",
    CUU: "Leu",
    CUC: "Leu",
    CUA: "Leu",
    CUG: "Leu",
    CCU: "Pro",
    CCC: "Pro",
    CCA: "Pro",
    CCG: "Pro",
    CAU: "His",
    CAC: "His",
    CAA: "Gln",
    CAG: "Gln",
    CGU: "Arg",
    CGC: "Arg",
    CGA: "Arg",
    CGG: "Arg",
    AUU: "Ile",
    AUC: "Ile",
    AUA: "Ile",
    AUG: "Met",
    ACU: "Thr",
    ACC: "Thr",
    ACA: "Thr",
    ACG: "Thr",
    AAU: "Asn",
    AAC: "Asn",
    AAA: "Lys",
    AAG: "Lys",
    AGU: "Ser",
    AGC: "Ser",
    AGA: "Arg",
    AGG: "Arg",
    GUU: "Val",
    GUC: "Val",
    GUA: "Val",
    GUG: "Val",
    GCU: "Ala",
    GCC: "Ala",
    GCA: "Ala",
    GCG: "Ala",
    GAU: "Asp",
    GAC: "Asp",
    GAA: "Glu",
    GAG: "Glu",
    GGU: "Gly",
    GGC: "Gly",
    GGA: "Gly",
    GGG: "Gly",
  };
  const bases = ["U", "C", "A", "G"];
  const left = 20,
    firstW = 34,
    colW = 134,
    rightW = 34;
  const top = 46,
    rowH = 19;
  let s = "";
  s += txt(320, 22, "Código genético — códons do RNAm, lidos no sentido 5′→3′", {
    size: 11,
    weight: "600",
  });
  s += `<rect x="${left}" y="${top - 22}" width="${firstW + colW * 4 + rightW}" height="${22 + rowH * 16}" fill="${PAPER}" stroke="${LINE}"/>`;
  s += `<rect x="${left}" y="${top - 22}" width="${firstW + colW * 4 + rightW}" height="22" fill="${CREAM}"/>`;
  bases.forEach((b, i) => {
    s += txt(left + firstW + colW * i + colW / 2, top - 7, b, { size: 11, weight: "700" });
  });
  s += txt(left + firstW / 2, top - 7, "1ª", { size: 9, fill: MUTED });
  s += txt(left + firstW + colW * 4 + rightW / 2, top - 7, "3ª", { size: 9, fill: MUTED });

  bases.forEach((b1, i) => {
    const y0 = top + i * rowH * 4;
    if (i > 0)
      s += `<line x1="${left}" y1="${y0}" x2="${left + firstW + colW * 4 + rightW}" y2="${y0}" stroke="${LINE}"/>`;
    s += txt(left + firstW / 2, y0 + rowH * 2 + 4, b1, { size: 13, weight: "700" });
    bases.forEach((b2, j) => {
      bases.forEach((b3, k) => {
        const codon = b1 + b2 + b3;
        const aa = table[codon];
        const y = y0 + k * rowH + 13;
        const x = left + firstW + colW * j + 10;
        const stop = aa === "Parada";
        const start = codon === "AUG";
        if (stop || start)
          s += `<rect x="${x - 6}" y="${y - 13}" width="${colW - 10}" height="${rowH}" fill="${stop ? "#f7eceb" : "#f3efe3"}"/>`;
        s += txt(x, y, codon, {
          size: 10,
          anchor: "start",
          weight: "600",
          fill: stop ? RED : INK,
        });
        s += txt(x + 42, y, start ? "Met · início" : aa, {
          size: 10,
          anchor: "start",
          fill: stop ? RED : MUTED,
        });
      });
    });
    bases.forEach((b3, k) => {
      s += txt(left + firstW + colW * 4 + rightW / 2, y0 + k * rowH + 13, b3, {
        size: 10,
        fill: MUTED,
      });
    });
  });
  for (let j = 1; j <= 4; j++)
    s += `<line x1="${left + firstW + colW * (j - 1)}" y1="${top - 22}" x2="${left + firstW + colW * (j - 1)}" y2="${top + rowH * 16}" stroke="${LINE}"/>`;
  s += `<line x1="${left + firstW + colW * 4}" y1="${top - 22}" x2="${left + firstW + colW * 4}" y2="${top + rowH * 16}" stroke="${LINE}"/>`;
  s += txt(
    320,
    412,
    "Ala alanina · Arg arginina · Asn asparagina · Asp ácido aspártico · Cys cisteína · Gln glutamina",
    { size: 8, fill: MUTED },
  );
  s += txt(
    320,
    424,
    "Glu ácido glutâmico · Gly glicina · His histidina · Ile isoleucina · Leu leucina · Lys lisina · Met metionina",
    { size: 8, fill: MUTED },
  );
  s += txt(
    320,
    436,
    "Phe fenilalanina · Pro prolina · Ser serina · Thr treonina · Trp triptofano · Tyr tirosina · Val valina",
    { size: 8, fill: MUTED },
  );
  write("aes-fig-01.svg", doc(w, h, s));
}

console.log("pronto");
