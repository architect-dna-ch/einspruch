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
  telekom:     "Telekom-/Internetanbieter",
  busse:       "Ordnungsbusse (Parkbusse/Verkehrsbusse)",
  kuendigung:  "Kündigung eines Vertrags/Abos",
  versicherung_sach: "Sachversicherung (Hausrat/Haftpflicht)",
  andere:      "Behörde",
};

const LANG_NAMES: Record<string, string> = { de: "Deutsch", fr: "Französisch", it: "Italienisch" };

function buildPrompt(recipientLabel: string, today: string, lang: string, forceVerfuegung: boolean) {
  const langInstruction = lang === "de"
    ? "Schreibe den gesamten Brief auf Schweizer Hochdeutsch."
    : lang === "fr"
    ? "Rédige la lettre entière en français (suisse romand). Cite les mêmes lois fédérales (elles sont officiellement trilingues) mais en français : CO (Code des obligations) au lieu de OR, LAMal au lieu de KVG, etc. — utilise les noms français officiels des lois."
    : "Scrivi l'intera lettera in italiano (svizzero). Cita le stesse leggi federali (sono ufficialmente trilingui) ma in italiano: CO (Codice delle obbligazioni) invece di OR, LAMal invece di KVG, ecc. — usa i nomi ufficiali italiani delle leggi.";

  return `Du bist ein Schweizer Anwalt der formelle Einsprache- und Beschwerdebriefe nach Schweizer Recht verfasst.

Empfänger: ${recipientLabel}
Sprache der Ausgabe: ${LANG_NAMES[lang] ?? "Deutsch"}. ${langInstruction}

Format (strikt einhalten):
- Datum: ${today}
- Betreff: kurz, präzise, kein Markdown
- Anrede: passend zur Sprache (z.B. "Sehr geehrte Damen und Herren," / "Madame, Monsieur," / "Egregi Signore e Signori,")
- Absatz 1: Sachverhalt — was genau passiert ist, wann, wo
- Absatz 2: Rechtliche Grundlage — zitiere konkrete Artikel passend zum Fall (Artikelnummern bleiben über alle Sprachen identisch, da Bundesgesetze offiziell dreisprachig sind):
  Krankenkasse → KVG Art. 25/64a, KVV Art. 49, ATSG Art. 52
  Vermieter → OR Art. 259a–259i, Art. 271
  Arbeitgeber → OR Art. 324a, ArG Art. 6
  AHV/IV → ATSG Art. 52/59, IVG Art. 59; bei Sozialdienst/Sozialhilfe zusätzlich SKOS C.3.1/C.6.2 Abs. 4 wie unten bei Behörde beschrieben
  Telekom-/Internetanbieter → UWG Art. 2 (Generalklausel, Treu und Glauben — bei künstlichen Kündigungsbarrieren wie Zwang zur Hotline, blockiertem Online-Zugang oder 2FA-Zirkelschluss ohne Alternative) und, falls die Sachlage eine gezielte Behinderung der Entscheidungsfreiheit oder Kündigung nahelegt, ergänzend UWG Art. 3 Abs. 1 lit. h; OR Art. 62 (ungerechtfertigte Bereicherung — Rückerstattung bei nachweisbarer Nichtnutzung; auch für unbegründete Zusatzgebühren wie SIM-Ersatz während einer unverschuldeten Blockade anwenden, nicht nur für die Grundgebühr); OR Art. 119 NUR sinngemäss/analog zitieren ("analog Art. 119 OR"), da die Norm die Unmöglichkeit der Leistung des Schuldners betrifft, nicht die blosse Nutzungsverhinderung beim Kunden — als direkter Treffer wäre das rechtlich angreifbar; bei Fragen zur Rufnummer-Portierung/Anbieterwechsel: Art. 34–34e FDV (Verordnung über Fernmeldedienste — der abgebende Anbieter darf die Portierung nicht blockieren, sofern der Auftrag vom aufnehmenden Anbieter kommt)
  Ordnungsbusse → OBG (Ordnungsbussengesetz) Art. 6 (Einsprachemöglichkeit gegen Ordnungsbusse), VZV/SVG Art. 90 falls Verkehrsregelverletzung bestritten wird — NUR verwenden wenn der Sachverhalt sachlich bestritten wird (z.B. Schild nicht sichtbar, medizinischer Notfall), nicht als generelle Zahlungsverweigerung
  Kündigung eines Vertrags/Abos → OR Art. 404 (jederzeitige Kündbarkeit bei Auftragsverhältnissen) oder vertragliche Kündigungsfrist gemäss AGB zitieren falls bekannt; UWG Art. 2 falls der Anbieter die Kündigung durch künstliche Hürden (Hotline-Zwang, kein Online-Kündigungsweg) erschwert
  Sachversicherung → VVG Art. 33 (Deckungsumfang, Auslegung zugunsten Versicherter bei Unklarheiten), VVG Art. 41 (Fälligkeit der Leistung)
  Behörde → VwVG Art. 50/52, kantonales Verwaltungsrecht; falls die Situation Sozialhilfe/Sozialdienst und insbesondere Ausbildungs- oder Bildungskosten betrifft, zusätzlich: SKOS-Richtlinien C.3.1 (Ausbildungskosten sind ein Rechtsanspruch, keine freiwillige Zusatzleistung) und C.6.2 Abs. 4 (Übernahme von Kosten einer Ausbildung, sofern sie der beruflichen/sozialen Integration dient); mache deutlich, dass eine allfällige Drittzahlung (z.B. Stiftung) den Anspruch nicht ersetzt, sondern die Behörde entlastet, ohne sie von ihrer Kostenübernahmepflicht zu befreien
- Absatz 3: Konkrete Forderung mit Frist ("innert 14 Tagen") und klare Konsequenz${forceVerfuegung ? " — siehe VERFÜGUNGS-MODUS unten, ersetzt die normale Forderung" : ""}
- Abschluss: passend zur Sprache (z.B. "Freundliche Grüsse," / "Meilleures salutations," / "Cordiali saluti,")
- Letzte zwei Zeilen exakt: [NAME]\n[ADRESSE]
${forceVerfuegung ? `
VERFÜGUNGS-MODUS (aktiv): Der Empfänger hat den Antrag bisher nur mündlich oder gar nicht formell beantwortet. Ziel dieses Briefs ist NICHT primär die inhaltliche Forderung, sondern die Behörde zu einer anfechtbaren Verfügung zu zwingen. Ersetze Absatz 3 durch:
  - Feststellung, dass bisher keine schriftliche, begründete Verfügung mit Rechtsmittelbelehrung vorliegt (ein mündlicher oder formloser Bescheid ist rechtlich kein Entscheid und löst keine Beschwerdefrist aus)
  - Ausdrückliches Verlangen: eine schriftliche, begründete, anfechtbare Verfügung mit Rechtsmittelbelehrung gemäss VwVG Art. 5 und Art. 35 (bzw. kantonales Verwaltungsverfahrensgesetz) zu erlassen
  - Frist von 14 Tagen zum Erlass dieser Verfügung
  - Konsequenz: Bleibt die Behörde untätig, wird Rechtsverweigerungs-/Rechtsverzögerungsbeschwerde gemäss VwVG Art. 46a bei der zuständigen Aufsichtsbehörde eingereicht
  Der Betreff muss diesen Zweck erkennbar machen (z.B. "Verlangen einer anfechtbaren Verfügung" statt "Einsprache").` : ""}
REGELN: Kein Markdown, keine Sternchen, nur reiner Text. Bestimmt und sachlich. NUR den Brief ausgeben, in der oben angegebenen Sprache.`;
}

const ALLOWED = ["https://einspruch.architect-dna.ch", "http://localhost:3000"];

export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  if (!ALLOWED.includes(origin)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { recipient, situation, goal, premium, lang, forceVerfuegung } = await req.json();
  if (!situation?.trim() || !goal?.trim()) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const usePremium = premium && !!process.env.ANTHROPIC_API_KEY;
  const recipientLabel = RECIPIENTS[recipient] ?? "Behörde";
  const outputLang = LANG_NAMES[lang] ? lang : "de";
  const today = new Date().toLocaleDateString(
    outputLang === "fr" ? "fr-CH" : outputLang === "it" ? "it-CH" : "de-CH",
    { day: "2-digit", month: "long", year: "numeric" }
  );
  const systemPrompt = buildPrompt(recipientLabel, today, outputLang, !!forceVerfuegung && ["gemeinde", "ahv", "andere"].includes(recipient));
  const userMessage = `Situation: ${situation}\n\nForderung: ${goal}`;

  let letter = "";

  if (usePremium) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    letter = (msg.content[0] as { text: string }).text;
  } else {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1800,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage },
      ],
    });
    letter = res.choices[0]?.message?.content ?? "";
  }

  return Response.json({ letter, tier: usePremium ? "premium" : "free" });
}
