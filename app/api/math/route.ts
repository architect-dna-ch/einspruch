import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";
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
  let problem = clip(body?.problem, 2000);
  // A photo of the problem (base64 JPEG, ≤ ~5 MB): Claude reads it, then Groq solves at full speed.
  const image = typeof body?.image === "string" && body.image.length < 7_000_000 ? body.image : "";
  let read = "";
  if (image) {
    read = await readPhoto(image);
    if (!read) return Response.json({ error: "unreadable" }, { status: 422 });
    problem = (problem.trim() ? problem.trim() + "\n\n" : "") + read;
  }
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
  return Response.json({ text, result, read, ms: Date.now() - t0 });
}

/** Transcribe the maths problem on a photo (worksheet, book, whiteboard) into plain text. */
async function readPhoto(b64: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const params = {
    model: "claude-opus-5-5",
    max_tokens: 2000,
    output_config: { effort: "low" },          // reading, not reasoning: keep it quick
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",                     // a policy decline is re-run on a fallback model
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
        { type: "text", text: "Schreib die Mathe-Aufgabe(n) auf diesem Foto exakt als Text ab, inklusive aller Zahlen, Einheiten und Teilaufgaben. Formeln in Unicode (², √, ×, ÷, Brüche als a/b), kein LaTeX. Steht ein Lösungsversuch daneben, schreib ihn mit 'Lösungsversuch:' darunter ab. Nur der abgeschriebene Text, keine Lösung, kein Kommentar. Ist keine Aufgabe zu erkennen, antworte nur: KEINE AUFGABE" },
      ],
    }],
  };
  const msg = await client.beta.messages.create(params as unknown as Anthropic.Beta.Messages.MessageCreateParamsNonStreaming);
  if (msg.stop_reason === "refusal") return "";
  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  return text && !text.startsWith("KEINE AUFGABE") ? text : "";
}
