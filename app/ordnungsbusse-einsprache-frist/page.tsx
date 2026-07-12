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
      title="Ordnungsbusse zu Unrecht erhalten — kannst du Einsprache erheben?"
      intro="Die meisten Leute zahlen eine Ordnungsbusse einfach, weil der Aufwand für eine Einsprache übertrieben wirkt. Bei einer klar bestreitbaren Busse — unklare Signalisation, ein medizinischer Notfall, ein Irrtum der Behörde — lohnt sich ein kurzer, formeller Brief trotzdem."
      sections={[
        {
          heading: "Wann eine Einsprache Sinn ergibt",
          body: "Nicht bei jeder Busse — wenn der Sachverhalt tatsächlich stimmt (du bist wirklich zu schnell gefahren), bringt eine Einsprache nichts. Sinnvoll ist sie, wenn die Signalisation nicht sichtbar/eindeutig war, ein Notfall vorlag, die Busse fälschlicherweise ausgestellt wurde, oder ein Formfehler vorliegt.",
        },
        {
          heading: "Was das Gesetz sagt",
          body: "Das Ordnungsbussengesetz (OBG) erlaubt es, eine Ordnungsbusse innert Frist zu bestreiten — akzeptierst du sie nicht, geht der Fall ins ordentliche Strafverfahren über, wo der Sachverhalt geprüft wird. Bei Verkehrsregelverletzungen ist zusätzlich das Strassenverkehrsgesetz (SVG) relevant.",
        },
        {
          heading: "Die Frist",
          body: "In der Regel musst du innert 30 Tagen ab Zustellung reagieren, wenn du die Ordnungsbusse nicht akzeptierst — sonst gilt sie als anerkannt. Die genaue Frist steht auf dem Bussenzettel selbst; sie einzuhalten ist entscheidend, danach ist eine Einsprache meist nicht mehr möglich.",
        },
        {
          heading: "Was du konkret brauchst",
          body: "Ein sachliches Schreiben, das den Sachverhalt aus deiner Sicht schildert (mit Beweisen falls vorhanden, z.B. Fotos der Signalisation), einen Verweis auf die relevanten Bestimmungen, und die klare Aussage, dass du die Busse nicht akzeptierst und um Überprüfung bittest.",
        },
      ]}
      ctaGo="busse"
      ctaLabel="Einsprache gegen die Busse erstellen"
    />
  );
}
