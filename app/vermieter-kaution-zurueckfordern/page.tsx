import type { Metadata } from "next";
import GuidePage from "../GuidePage";

export const metadata: Metadata = {
  title: "Kaution vom Vermieter zurückfordern — was tun? | Einspruch",
  description: "Der Vermieter gibt die Mietkaution nach dem Auszug nicht zurück? So gehst du vor, mit den passenden OR-Artikeln.",
  alternates: { canonical: "https://einspruch.architect-dna.ch/vermieter-kaution-zurueckfordern" },
};

export default function Page() {
  return (
    <GuidePage
      kicker="Vermieter"
      title="Kaution bleibt weg?"
      intro="Ausgezogen, übergeben — und die Kaution kommt nicht zurück. Einer der häufigsten Mietstreitpunkte, und die Fristen sind klar."
      sections={[
        {
          heading: "Die Grundlage",
          body: "OR Art. 257e: Die Kaution liegt auf einem gesperrten Konto auf deinen Namen.\n\nErhebt der Vermieter innert einem Jahr nach Auszug keine Ansprüche, ist sie freizugeben.",
        },
        {
          heading: "Wann Einbehalt gilt",
          body: "Nur bei nachweisbaren Schäden über die normale Abnutzung hinaus, offenen Mietzinsen oder Nebenkosten.\n\nGebrauchsspuren sind kein Schaden.",
        },
        {
          heading: "Die Frist",
          body: "Ein Jahr ab Rückgabe — danach klarer Anspruch, wenn nichts unternommen wurde.\n\nSchriftliche Fristsetzung lohnt sich schon früher.",
        },
        {
          heading: "Was du brauchst",
          body: "Bezug aufs Abnahmeprotokoll · Verweis auf OR Art. 257e · klare Frist zur Freigabe bei der Bank.",
        },
      ]}
      ctaGo="vermieter"
      ctaLabel="Brief erstellen"
    />
  );
}
