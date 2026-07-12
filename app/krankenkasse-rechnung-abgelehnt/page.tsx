import type { Metadata } from "next";
import GuidePage from "../GuidePage";

export const metadata: Metadata = {
  title: "Krankenkasse lehnt Rechnung ab — was tun? | Einspruch",
  description: "Deine Krankenkasse hat eine Rechnung abgelehnt oder nicht korrekt abgerechnet? So gehst du vor, mit den passenden KVG-Artikeln.",
  alternates: { canonical: "https://einspruch.architect-dna.ch/krankenkasse-rechnung-abgelehnt" },
};

export default function Page() {
  return (
    <GuidePage
      kicker="Krankenkasse"
      title="Die Krankenkasse hat deine Rechnung abgelehnt — was jetzt?"
      intro="Das passiert öfter als man denkt: Eine Behandlung wird nicht oder nur teilweise übernommen, obwohl sie medizinisch notwendig war. Die meisten Leute zahlen dann einfach — dabei hast du ein klares gesetzliches Recht auf Einsprache."
      sections={[
        {
          heading: "Warum Krankenkassen ablehnen",
          body: "Häufige Gründe: die Behandlung wird als 'nicht wirksam, zweckmässig oder wirtschaftlich' eingestuft (WZW-Kriterien), es gab einen Abrechnungsfehler, oder die Kasse verlangt eine vorherige Kostengutsprache, die im Notfall gar nicht möglich war. Nicht jede Ablehnung ist rechtens.",
        },
        {
          heading: "Was das Gesetz sagt",
          body: "Gemäss KVG Art. 25 übernimmt die obligatorische Krankenpflegeversicherung die Kosten für Leistungen, die der Diagnose oder Behandlung einer Krankheit dienen — sofern sie wirksam, zweckmässig und wirtschaftlich sind. Bei Notfällen ist gemäss gängiger Praxis keine vorherige Kostengutsprache nötig. KVV Art. 49 regelt die korrekte Tarifabrechnung.",
        },
        {
          heading: "Die Frist",
          body: "Eine formelle Einsprache gegen einen Entscheid der Krankenkasse muss in der Regel innert 30 Tagen ab Erhalt der Verfügung eingereicht werden (ATSG Art. 52). Bei einer blossen Rechnung ohne formelle Verfügung ist es sinnvoll, so schnell wie möglich schriftlich zu reagieren — spätestens aber, bevor eine Mahnung oder ein Betreibungsverfahren folgt.",
        },
        {
          heading: "Was du konkret brauchst",
          body: "Ein schriftliches, sachliches Schreiben mit: Datum und Art der Behandlung, warum sie medizinisch notwendig war, Verweis auf KVG Art. 25, und eine klare Frist für die Neubeurteilung. Ein Anruf reicht meistens nicht — schriftlich hinterlässt eine Spur und wirkt ernster.",
        },
      ]}
      ctaGo="kk"
      ctaLabel="Brief an die Krankenkasse erstellen"
    />
  );
}
