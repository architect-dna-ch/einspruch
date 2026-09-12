import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

const KATEGORIEN: Record<string, string> = {
  kk:          "Krankenkasse",
  vermieter:   "Vermieter",
  bank:        "Bank / Versicherung",
  behoerde:    "Behörde / Gemeinde / Sozialversicherung",
  arbeitgeber: "Arbeitgeber",
  firma:       "Firma / Abo / Vertrag",
  andere:      "Andere Gegenpartei",
};

const ALLOWED = ["https://einspruch.architect-dna.ch", "http://localhost:3000"];

const SYSTEM_PROMPT = `Du bist ein erfahrener Schweizer Fallprüfer (kein Anwalt, keine Rechtsberatung) und gibst Laien eine erste, unverbindliche Einschätzung, ob es sich lohnt, Geld zurückzufordern.

Nutze dieses Wissen über einschlägige Schweizer Gesetzesartikel:
Krankenkasse → KVG Art. 25/64a, KVV Art. 49, ATSG Art. 52
Vermieter → OR Art. 259a–259i, Art. 271
Bank/Versicherung → VVG Art. 33/41, OR Art. 62 (ungerechtfertigte Bereicherung)
Behörde/Gemeinde/Sozialversicherung → VwVG Art. 50/52, ATSG Art. 52/59, SKOS C.3.1/C.6.2
Arbeitgeber → OR Art. 324a, ArG Art. 6
Firma/Abo/Vertrag → OR Art. 404, OR Art. 62, UWG Art. 2/3

Antworte AUSSCHLIESSLICH mit kompaktem JSON, keine Erklärung drumherum, exakt dieses Schema:
{"chance":"gut"|"mittel"|"schwierig","artikel":["Art. X OR", "..."],"begruendung":"2-3 Sätze, Schweizer Hochdeutsch, direkt und ehrlich, ohne Fachjargon, ohne Garantie-Versprechen"}

Sei ehrlich — wenn ein Fall schwach ist, sag "schwierig" und erkläre warum, statt falsche Hoffnung zu machen. Das ist keine Rechtsberatung und keine Garantie, das machst du in "begruendung" indirekt spürbar (nicht wortwörtlich wiederholen, das steht schon auf der Seite).`;

export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  if (!ALLOWED.includes(origin)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { kategorie, betrag, situation } = await req.json();
  if (!situation?.trim()) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const kategorieLabel = KATEGORIEN[kategorie] ?? "Gegenpartei";
  const userMessage = `Kategorie: ${kategorieLabel}\nGeschätzter Betrag: CHF ${betrag || "unbekannt"}\nSituation: ${situation}`;

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const res = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      max_tokens: 900,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });
    const raw = res.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    const chance = ["gut", "mittel", "schwierig"].includes(parsed.chance) ? parsed.chance : "mittel";
    const artikel = Array.isArray(parsed.artikel) ? parsed.artikel.slice(0, 5) : [];
    const begruendung = typeof parsed.begruendung === "string" ? parsed.begruendung : "";
    return Response.json({ chance, artikel, begruendung });
  } catch {
    return Response.json({ error: "assessment_failed" }, { status: 500 });
  }
}
