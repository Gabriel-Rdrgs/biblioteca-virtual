"""Extrai do artifact "Simulador de Prova Prática — MAC I" os dados e as
figuras, para o Atlas.

Uso: python -I scripts/pratica/extrair.py <artifact.html> <repo>
(o HTML vem de "ler" o artifact; precisa de Pillow)

Saídas:
  <repo>/src/lib/data/pratica/mac1.json
  <repo>/storage/flashcards/pratica-*.jpg   (figuras; servidas atrás da senha)
"""
import base64
import json
import os
import random
import re
import sys

html_path, repo = sys.argv[1], sys.argv[2]
src = open(html_path, encoding="utf8").read()


# ------------------------------------------------- leitor de literais JS
class P:
    def __init__(self, s, i, env):
        self.s, self.i, self.env = s, i, env

    def ws(self):
        s = self.s
        while self.i < len(s):
            if s[self.i] in " \t\r\n":
                self.i += 1
            elif s.startswith("//", self.i):
                self.i = s.index("\n", self.i)
            elif s.startswith("/*", self.i):
                self.i = s.index("*/", self.i) + 2
            else:
                break

    def value(self):
        self.ws()
        c = self.s[self.i]
        if c == "{":
            return self.obj()
        if c == "[":
            return self.arr()
        if c in "'\"`":
            return self.string()
        m = re.compile(r"-?\d+(\.\d+)?").match(self.s, self.i)
        if m:
            self.i = m.end()
            return float(m.group()) if "." in m.group() else int(m.group())
        m = re.compile(r"[A-Za-z_$][\w$]*").match(self.s, self.i)
        if m:
            self.i = m.end()
            name = m.group()
            if name in ("true", "false"):
                return name == "true"
            if name in ("null", "undefined"):
                return None
            if name in self.env:
                return self.env[name]
            raise ValueError(f"identificador desconhecido {name} em {self.i}")
        raise ValueError(f"inesperado {c!r} em {self.i}: {self.s[self.i:self.i+40]!r}")

    def string(self):
        q = self.s[self.i]
        self.i += 1
        out = []
        while True:
            c = self.s[self.i]
            if c == "\\":
                n = self.s[self.i + 1]
                if n == "u":
                    out.append(chr(int(self.s[self.i + 2:self.i + 6], 16)))
                    self.i += 6
                    continue
                out.append({"n": "\n", "t": "\t"}.get(n, n))
                self.i += 2
                continue
            if c == q:
                self.i += 1
                return "".join(out)
            if q == "`" and c == "$" and self.s[self.i + 1] == "{":
                raise ValueError("template com expressão")
            out.append(c)
            self.i += 1

    def obj(self):
        self.i += 1
        out = {}
        while True:
            self.ws()
            if self.s[self.i] == "}":
                self.i += 1
                return out
            if self.s[self.i] in "'\"":
                key = self.string()
            else:
                m = re.compile(r"[A-Za-z_$][\w$]*|\d+").match(self.s, self.i)
                key = m.group()
                self.i = m.end()
            self.ws()
            assert self.s[self.i] == ":", self.s[self.i:self.i + 30]
            self.i += 1
            out[key] = self.value()
            self.ws()
            if self.s[self.i] == ",":
                self.i += 1

    def arr(self):
        self.i += 1
        out = []
        while True:
            self.ws()
            if self.s[self.i] == "]":
                self.i += 1
                return out
            out.append(self.value())
            self.ws()
            if self.s[self.i] == ",":
                self.i += 1


def grab(marker, env=None, start=0):
    i = src.index(marker, start) + len(marker)
    p = P(src, i, env or {})
    return p.value()


ENV = {
    "NET": "Netter — Flash Cards de Anatomia",
    "MOO": "Moore — Embriologia Básica, 10ª ed.",
    "GAR": "Gartner & Hiatt — Tratado de Histologia",
}

BOOK = grab("const BOOK=", ENV)
ANS = grab("const ANS=")
for k, v in ANS.items():
    BOOK[k]["g"] = v
T = grab("const T=")
ST = grab("const ST=")
BQ = grab("const BQ=")
MAP = grab("const MAP=")
OCC = grab("const OCC=")
ARW = set(grab("const ARW=new Set("))
MARKS = grab("const MARKS=")
FIGPTS = grab("pts:", start=src.index("const FIG="))

# ------------------------------------------------- figuras
images = {}
bi_start = src.index("const BI=")
for m in re.finditer(r'"([a-z0-9_]+)":\s*"(data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+)"', src):
    if m.start() < bi_start:
        continue
    images.setdefault(m.group(1), m.group(2))
img_model = re.search(r"const IMG='(data:image/(jpeg|png);base64,[A-Za-z0-9+/=]+)'", src).group(1)
images["modelo"] = img_model

out_dir = os.path.join(repo, "storage", "flashcards")
os.makedirs(out_dir, exist_ok=True)


def fname(key):
    return "pratica-" + key.replace("_", "-").lower() + ".jpg"


written = 0
for key, uri in images.items():
    data = base64.b64decode(uri.split(",", 1)[1])
    ext = uri.split(";")[0].split("/")[1]
    assert ext in ("jpeg", "jpg"), (key, ext)
    with open(os.path.join(out_dir, fname(key)), "wb") as fh:
        fh.write(data)
    written += 1


# ------------------------------------------------- texto: <b> → **, <br> → \n
def txt(s):
    if s is None:
        return None
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"</?b>", "**", s)
    assert "<" not in s.replace("< ", ""), s[:80]
    return s.strip()


AREA = {"A": "anatomia", "E": "embriologia", "H": "histologia"}

figures = {}
for k, b in BOOK.items():
    assert k in images, f"sem imagem: {k}"
    figures[k] = {
        "file": fname(k),
        "source": b["l"],
        "ref": b["r"],
        "caption": b["c"],
        "topics": b["t"],
        "key": [txt(x) for x in b.get("g", [])],
    }
figures["modelo"] = {
    "file": fname("modelo"),
    "source": "Laboratório de anatomia",
    "ref": "Modelo",
    "caption": "Modelo do desenvolvimento embrionário (clivagem, blastocisto, implantação e embrião)",
    "topics": ["extra"],
    "key": [],
    # Pontos numerados sobre a foto (viewBox 1000×563): [x, y, rótulo].
    "points": {k: {"x": v[0] / 10, "y": v[1] / 5.63, "label": v[2]} for k, v in FIGPTS.items()},
}
for m in MARKS:
    figures[m["k"]] = {
        "file": fname(m["k"]),
        "source": BOOK[m["src"]]["l"],
        "ref": BOOK[m["src"]]["r"],
        "caption": BOOK[m["src"]]["c"],
        "topics": BOOK[m["src"]]["t"],
        "key": [],
        "arrowOf": m["src"],
    }

topics = []
for t in T:
    topics.append({
        "id": t["id"],
        "area": AREA[t["a"]],
        "region": t.get("reg"),
        "title": t["t"],
        "schema": txt(t["esq"]),
        "five": {
            "identification": txt(t["f"]["id"]),
            "location": txt(t["f"]["loc"]),
            "function": txt(t["f"]["fun"]),
            "origin": txt(t["f"]["inv"]),
            "clinical": txt(t["f"]["cli"]),
        },
        "asks": [txt(x) for x in t["pede"]],
        "model": txt(t["mod"]),
        "memo": txt(t["memo"]),
        "review": [{"q": txt(q), "a": txt(a)} for q, a in t["qs"]],
        "traps": [txt(x) for x in t["trap"]],
    })


def q_out(q):
    if q["t"] == "mc":
        return {"type": "mc", "q": txt(q["q"]), "options": [txt(o) for o in q["o"]],
                "answer": q["a"], "why": txt(q.get("e")), "model": txt(q.get("m"))}
    return {"type": "open", "q": txt(q["q"]), "model": txt(q["m"])}


stations = []
for i, s in enumerate(ST):
    st = {
        "id": f"st{i + 1}",
        "area": AREA[s["k"]],
        "topic": s["top"],
        "figure": s.get("img") or "modelo",
        "context": txt(s["d"]),
        "questions": [q_out(q) for q in s["qs"]],
    }
    if s.get("fig") == "modelo":
        st["points"] = s["marks"]
    stations.append(st)

# Estações geradas, como no artifact: figura numerada com o número em destaque…
rng = random.Random(2026)
topic_area = {t["id"]: t["a"] for t in T}
groups = {}
for idx, o in enumerate(OCC):
    if o["f"] not in ARW:
        groups.setdefault(o["f"], []).append(idx)
for f, ix in groups.items():
    if len(ix) < 4:
        continue
    tp = BOOK[f]["t"][0]
    pick = [ix[0], ix[len(ix) // 2]]

    def mk_occ(j):
        others = [OCC[x]["a"] for x in ix if x != j]
        rng.shuffle(others)
        return {"type": "mc", "q": f"Qual é a estrutura de número {OCC[j]['n']}?",
                "options": [OCC[j]["a"]] + others[:3], "answer": 0,
                "why": f"Na {BOOK[f]['l'].split(' — ')[0]} ({BOOK[f]['r']}), o número {OCC[j]['n']} é **{OCC[j]['a']}**.",
                "model": OCC[j]["a"], "box": OCC[j]["r"]}

    stations.append({"id": f"occ-{f}", "area": AREA[topic_area[tp]], "topic": tp, "figure": f,
                     "context": f"{BOOK[f]['l'].split(' — ')[0]} · {BOOK[f]['r']}: {BOOK[f]['c']}.",
                     "questions": [mk_occ(j) for j in pick]})

# …e lâmina com seta.
by_src = {}
for idx, m in enumerate(MARKS):
    by_src.setdefault(m["src"], []).append(idx)
all_a = [m["a"] for m in MARKS]
for f, ix in by_src.items():
    tp = BOOK[f]["t"][0]
    pk = [ix[0], ix[1]] if len(ix) >= 2 else [ix[0], ix[0]]

    def mk_arrow(j, two=False):
        m = MARKS[j]
        if two:
            return {"type": "open", "figure": m["k"],
                    "q": "Que tecido ou estrutura é esta lâmina, e por qual característica você reconhece?",
                    "model": f"{BOOK[f]['c']}."}
        pool = [MARKS[x]["a"] for x in ix if MARKS[x]["a"] != m["a"]]
        extra = [a for a in all_a if a != m["a"]]
        rng.shuffle(extra)
        opts = [m["a"]]
        for a in pool + extra:
            if a not in opts:
                opts.append(a)
            if len(opts) == 4:
                break
        return {"type": "mc", "figure": m["k"], "q": "Qual estrutura a seta amarela indica?",
                "options": opts, "answer": 0,
                "why": f"A seta aponta **{m['a']}** ({BOOK[f]['l'].split(' — ')[0]}, {BOOK[f]['r']}).",
                "model": m["a"]}

    qs = [mk_arrow(pk[0]), mk_arrow(pk[0], True) if pk[0] == pk[1] else mk_arrow(pk[1])]
    stations.append({"id": f"seta-{f}", "area": AREA[topic_area[tp]], "topic": tp, "figure": f,
                     "context": f"{BOOK[f]['l'].split(' — ')[0]} · {BOOK[f]['r']}. Uma seta amarela indica a estrutura.",
                     "questions": qs})

bank = [{"area": AREA[a], "topic": tp, "q": txt(q), "a": txt(r), "why": txt(e), "trap": txt(trap)}
        for a, tp, q, r, e, trap in BQ]

chains = [{"title": title, "area": AREA[a],
           "steps": [{"name": txt(n), "text": txt(d), "figure": fig} for n, d, fig in steps]}
          for title, a, steps in MAP]

data = {
    "title": "MAC I · Prova prática N2",
    "case": None,
    "figures": figures,
    "topics": topics,
    "stations": stations,
    "bank": bank,
    "chains": chains,
}

# O caso clínico, em tópicos (da página inicial do artifact).
case_html = src[src.index("<h2>O caso em 30 segundos</h2>"):]
case_html = case_html[:case_html.index("</ul>")]
data["case"] = [txt(re.sub(r"<[^b/][^>]*>|</[^b][^>]*>", "", li)) for li in re.findall(r"<li>(.*?)</li>", case_html)]

# Tamanho de cada figura, para a página não pular enquanto ela carrega.
from PIL import Image  # noqa: E402

for f in figures.values():
    with Image.open(os.path.join(out_dir, f["file"])) as im:
        f["width"], f["height"] = im.size

out = os.path.join(repo, "src", "lib", "data", "pratica")
os.makedirs(out, exist_ok=True)
with open(os.path.join(out, "mac1.json"), "w", encoding="utf8", newline="\n") as fh:
    json.dump(data, fh, ensure_ascii=False, indent=1)
    fh.write("\n")

print("figuras:", written, "| temas:", len(topics), "| estações:", len(stations),
      "| banco:", len(bank), "| cadeias:", len(chains), "| caso:", len(data["case"]))
missing = {s["figure"] for s in stations} - set(figures)
print("estações sem figura:", missing)
