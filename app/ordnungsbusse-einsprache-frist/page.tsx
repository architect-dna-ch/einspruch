import type { Metadata } from "next";
import GuidePage from "../GuidePage";

export const metadata: Metadata = {
  title: "Einsprache gegen Ordnungsbusse — Frist & Vorgehen | Einspruch",
  description: "Parkbusse oder Verkehrsbusse zu Unrecht erhalten? So legst du Einsprache ein, mit Frist und rechtlicher Grundlage.",
  alternates: { canonical: "https://einspruch.architect-dna.ch/ordnungsbusse-einsprache-frist" },
};

export default function Page() {
  return (
    <GuidePage
      kicker="Ordnungsbusse"
      title="Busse zu Unrecht?"
      intro="Die meisten zahlen, weil der Aufwand grösser wirkt als die Busse. Bei einer klar bestreitbaren Busse lohnt sich ein kurzer, formeller Brief trotzdem."
      sections={[
        {
          heading: "Wann es Sinn ergibt",
          body: "Signalisation unklar · Notfall · falsch ausgestellt · Formfehler.\n\nNicht, wenn der Sachverhalt stimmt.",
        },
        {
          heading: "Die Grundlage",
          body: "OBG erlaubt das Bestreiten innert Frist. Akzeptierst du nicht, geht es ins ordentliche Strafverfahren — dort wird der Sachverhalt geprüft.",
        },
        {
          heading: "Das Risiko",
          body: "Verlierst du dort, entfällt der Schutz der Ordnungsbusse: höherer Betrag, Verfahrenskosten, möglicher Registereintrag.\n\nNur mit begründeter Bestreitung einreichen.",
        },
        {
          heading: "Die Frist",
          body: "In der Regel 30 Tage ab Zustellung. Danach gilt die Busse als anerkannt.\n\nDie genaue Frist steht auf dem Bussenzettel.",
        },
        {
          heading: "Was du brauchst",
          body: "Sachverhalt aus deiner Sicht · Beweise (z.B. Foto der Signalisation) · Verweis auf die Bestimmungen · die klare Aussage, dass du nicht akzeptierst.",
        },
      ]}
      ctaGo="busse"
      ctaLabel="Einsprache erstellen"
    />
  );
}
