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
      title="Der Vermieter gibt die Kaution nicht zurück — was jetzt?"
      intro="Ausgezogen, Wohnung übergeben, und die Kaution kommt einfach nicht zurück — oder der Vermieter behält sie ohne nachvollziehbaren Grund ein. Das ist einer der häufigsten Mieter-Streitpunkte in der Schweiz, und die Fristen sind klar geregelt."
      sections={[
        {
          heading: "Was das Gesetz sagt",
          body: "Gemäss OR Art. 257e muss die Mietkaution auf einem gesperrten Bankkonto auf den Namen des Mieters hinterlegt werden. Erhebt der Vermieter innert einem Jahr nach Auszug keine Ansprüche (z.B. durch Klage oder Betreibung), ist die Kaution freizugeben. Der Vermieter kann nicht einfach unbegrenzt lange zuwarten oder Beträge ohne Begründung einbehalten.",
        },
        {
          heading: "Wann ein Einbehalt gerechtfertigt ist",
          body: "Nur bei nachweisbaren, über die normale Abnutzung hinausgehenden Schäden, offenen Mietzinsen oder Nebenkostenabrechnungen. Normale Gebrauchsspuren (leichte Abnützung von Boden, Wänden) gelten nicht als Schaden — dafür ist die Kaution nicht da.",
        },
        {
          heading: "Die Frist",
          body: "Ein Jahr ab Rückgabe der Mietsache — danach hast du gemäss OR Art. 257e einen klaren Anspruch auf Rückzahlung, wenn der Vermieter in dieser Zeit nichts unternommen hat. Auch vorher lohnt sich eine schriftliche Fristsetzung, sobald der Auszug erfolgt und keine Mängel dokumentiert wurden.",
        },
        {
          heading: "Was du konkret brauchst",
          body: "Ein schriftliches Schreiben mit Bezug auf das Abnahmeprotokoll (falls vorhanden), Verweis auf OR Art. 257e, und eine klare Frist zur Freigabe der Kaution beim Bankinstitut. Falls der Vermieter nicht reagiert, kann die Bank nach Fristablauf teilweise auch direkt kontaktiert werden.",
        },
      ]}
      ctaGo="vermieter"
      ctaLabel="Brief an den Vermieter erstellen"
    />
  );
}
