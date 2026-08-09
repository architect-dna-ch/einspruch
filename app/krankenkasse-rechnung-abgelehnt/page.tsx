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
      title="Rechnung abgelehnt?"
      intro="Eine Behandlung wird nicht übernommen, obwohl sie nötig war. Die meisten zahlen dann einfach — du hast aber ein gesetzliches Recht auf Einsprache."
      sections={[
        {
          heading: "Warum abgelehnt wird",
          body: "WZW-Kriterien nicht erfüllt · Abrechnungsfehler · fehlende Kostengutsprache.\n\nNicht jede Ablehnung ist rechtens.",
        },
        {
          heading: "Die Grundlage",
          body: "KVG Art. 25: die Grundversicherung übernimmt, was der Diagnose oder Behandlung dient — wirksam, zweckmässig, wirtschaftlich.\n\nIm Notfall braucht es keine vorherige Kostengutsprache. KVV Art. 49 regelt den Tarif.",
        },
        {
          heading: "Die Frist",
          body: "30 Tage ab Verfügung (ATSG Art. 52).\n\nBei einer blossen Rechnung ohne Verfügung: sofort schriftlich reagieren, jedenfalls vor Mahnung oder Betreibung.",
        },
        {
          heading: "Was du brauchst",
          body: "Datum und Art der Behandlung · warum sie nötig war · Verweis auf KVG Art. 25 · eine klare Frist.\n\nEin Anruf hinterlässt keine Spur.",
        },
      ]}
      ctaGo="kk"
      ctaLabel="Brief erstellen"
    />
  );
}
