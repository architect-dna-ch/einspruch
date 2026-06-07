import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const RECIPIENTS: Record<string, string> = {
  kk:          "Krankenkasse",
  gemeinde:    "Gemeindeverwaltung / Behörde",
  vermieter:   "Vermieter",
  arbeitgeber: "Arbeitgeber",
  ahv:         "AHV/IV/Sozialversicherung",
  bank:        "Bank / Versicherung",
  andere:      "Behörde",
};

function buildPrompt(recipientLabel: string, today: string) {
  return `Du bist ein Schweizer Anwalt der formelle Einsprache- und Beschwerdebriefe nach Schweizer Recht verfasst.

Empfänger: ${recipientLabel}

Format (strikt einhalten):
- Datum: ${today}
- Betreff: kurz, präzise, kein Markdown
- Anrede: "Sehr geehrte Damen und Herren,"
- Absatz 1: Sachverhalt — was genau passiert ist, wann, wo
- Absatz 2: Rechtliche Grundlage — zitiere konkrete Artikel passend zum Fall:
  Krankenkasse → KVG Art. 25/64a, KVV Art. 49, ATSG Art. 52
  Vermieter → OR Art. 259a–259i, Art. 271
  Arbeitgeber → OR Art. 324a, ArG Art. 6
  AHV/IV → ATSG Art. 52/59, IVG Art. 59
  Behörde → VwVG Art. 50/52, kantonales Verwaltungsrecht
- Absatz 3: Konkrete Forderung mit Frist ("innert 14 Tagen") und klare Konsequenz
- Abschluss: "Freundliche Grüsse,"
- Letzte zwei Zeilen exakt: [NAME]\n[ADRESSE]

REGELN: Kein Markdown, keine Sternchen, nur reiner Text. Bestimmt und sachlich. NUR den Brief ausgeben.`;
}

const ALLOWED = ["https://einspruch.architect-dna.ch", "http://localhost:3000"];

export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  if (!ALLOWED.includes(origin)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { recipient, situation, goal, premium } = await req.json();
  if (!situation?.trim() || !goal?.trim()) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const usePremium = premium && !!process.env.ANTHROPIC_API_KEY;
  const recipientLabel = RECIPIENTS[recipient] ?? "Behörde";
  const today = new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" });
  const systemPrompt = buildPrompt(recipientLabel, today);
  const userMessage = `Situation: ${situation}\n\nForderung: ${goal}`;

  let letter = "";

  if (usePremium) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    letter = (msg.content[0] as { text: string }).text;
  } else {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 900,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage },
      ],
    });
    letter = res.choices[0]?.message?.content ?? "";
  }

  return Response.json({ letter, tier: usePremium ? "premium" : "free" });
}
