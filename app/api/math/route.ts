import Groq from "groq-sdk";
import { allow, clientIp, clip } from "@/app/lib/guard";

export const dynamic = "force-dynamic";

// ARC Math: maths help for school (KV / BM level and beyond), as fast as possible.
// Groq runs gpt-oss-120b at several hundred tokens per second; "medium" reasoning keeps the
// answers right without making them slow.
const ALLOWED = ["https://einspruch.architect-dna.ch", "http://localhost:3000"];

const MODES: Record<string, string> = {
  steps: "Löse die Aufgabe Schritt für Schritt. Jeder Schritt eine kurze Zeile mit der Rechnung und einem halben Satz Erklärung.",
  answer: "Gib nur das Ergebnis mit höchstens einer Zeile Rechnung.",
  explain: "Erkläre den Lösungsweg so einfach wie für einen 15-Jährigen, mit einem Alltagsbeispiel, dann die Lösung.",
  check: "Der Text enthält eine Aufgabe UND einen Lösungsversuch. Prüfe den Versuch: was stimmt, wo genau ist der erste Fehler, wie geht es richtig. Sei ermutigend und präzise.",
};

export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  if (!ALLOWED.includes(origin)) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!allow(`math:${clientIp(req)}`, 60, 3_600_000)) return Response.json({ error: "rate_limited" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const problem = clip(body?.problem, 2000);
  if (!problem.trim()) return Response.json({ error: "Missing problem" }, { status: 400 });
  const mode = typeof body?.mode === "string" && body.mode in MODES ? body.mode : "steps";
  const lang = body?.lang === "de" ? "Deutsch (Schweiz, ss statt ß)" : "English";

  const system = `Du bist ARC Math, ein präziser Mathe-Tutor für Schule und Berufsmaturität (KV/BM, Rechnungswesen, Finanzmathematik, Algebra, Geometrie, Statistik).
Antwortsprache: ${lang}.
${MODES[mode]}
REGELN:
- Rechne sorgfältig und kontrolliere das Ergebnis am Ende (Probe), aber zeige die Probe nur in einer kurzen Zeile.
- KEIN LaTeX, KEIN Markdown, keine Sternchen. Nutze Unicode: ², ³, √, ×, ÷, ±, ≈, ≤, ≥, π, ∑, Brüche als a/b.
- Geldbeträge im Schweizer Format (CHF 1'250.50). Runde Geld auf 5 Rappen nur wenn verlangt.
- Letzte Zeile genau so: "→ " gefolgt vom Endergebnis (bzw. bei Prüfen: "→ richtig" oder "→ Fehler in Schritt …").
- Ist die Aufgabe unklar, rechne mit der wahrscheinlichsten Lesart und nenne die Annahme in einer Zeile.`;

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const t0 = Date.now();
  const res = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    reasoning_effort: "medium",
    max_tokens: 3000,
    messages: [
      { role: "system", content: system },
      { role: "user", content: problem },
    ],
  });
  const text = (res.choices[0]?.message?.content ?? "").replace(/\*\*/g, "").replace(/\$+/g, "").trim();
  if (!text) return Response.json({ error: "empty" }, { status: 502 });
  const lines = text.split("\n");
  const last = lines.length ? lines[lines.length - 1] : "";
  const result = last.startsWith("→") ? last.replace(/^→\s*/, "") : "";
  return Response.json({ text, result, ms: Date.now() - t0 });
}
