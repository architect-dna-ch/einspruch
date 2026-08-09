import type { Metadata } from "next";
import GuidePage from "../GuidePage";

export const metadata: Metadata = {
  title: "Belegmappe — Beweise sammeln, bevor du sie brauchst | Einspruch",
  description: "Wie du Anträge, Antworten, Fristen und Zahlungen so ablegst, dass du im Streitfall sofort belegen kannst, was passiert ist.",
  alternates: { canonical: "https://einspruch.architect-dna.ch/belegmappe" },
};

export default function Page() {
  return (
    <GuidePage
      kicker="Belegmappe"
      title="Beweise sammeln, bevor du sie brauchst"
      intro="Ein Verfahren wird nicht damit gewonnen, dass du im Recht bist, sondern damit, dass du es belegen kannst. Wer erst beim Streit anfängt zu sammeln, hat meist schon Lücken — E-Mails sind gelöscht, das Datum eines Telefonats ist vergessen, das mündliche Versprechen lässt sich nicht mehr nachweisen. Eine Belegmappe ist keine Bürokratie, sie ist Selbstschutz."
      sections={[
        {
          heading: "Fünf Kategorien, ein Ordner",
          body: "Ob digital (ein Ordner mit fünf Unterordnern) oder auf Papier — die Struktur bleibt gleich:\n\n1. Anträge & Gesuche — alles, was du selbst eingereicht hast, mit Datum der Einreichung (Einschreiben-Beleg oder Sendebestätigung aufheben)\n2. Antworten & Verfügungen — jede Reaktion der Gegenseite, auch ein knappes 'nein' per Mail\n3. Fristen — eine einzige Liste (Tabelle reicht) mit Datum des Ereignisses, Ablauf der Frist, und was du bis dahin tun musst\n4. Zahlungen & Rechnungen — Belege, Kontoauszüge, Mahnungen\n5. Kommunikation — Telefonnotizen (Datum, Uhrzeit, Gesprächspartner, was gesagt wurde), auch wenn es unangenehm ist, sich das im Moment zu merken",
        },
        {
          heading: "Die Regel für jedes Dokument",
          body: "Dateiname beginnt mit dem Datum im Format JJJJ-MM-TT, dann eine kurze Bezeichnung. So sortiert sich der Ordner chronologisch von selbst, ohne dass du etwas tun musst — und im Streitfall siehst du auf einen Blick, was wann passiert ist.",
        },
        {
          heading: "Mündliche Aussagen sofort schriftlich festhalten",
          body: "Direkt nach einem Telefonat oder Termin: ein kurzes Mail an dich selbst oder eine Notiz mit Datum, Zeit, Namen der Person und dem Inhalt in eigenen Worten. Das ist kein Beweis erster Klasse, aber besser als eine Erinnerung, die sich Wochen später nicht mehr belegen lässt. Noch besser: dieselbe Zusammenfassung als Bestätigungsmail an die Gegenseite senden ('Wie besprochen halte ich fest, dass...') — bleibt sie unwidersprochen, wird sie zum eigenständigen Beleg.",
        },
        {
          heading: "Warum das den Unterschied macht",
          body: "Eine Behörde oder Gegenpartei, die merkt, dass du lückenlos dokumentierst, verhält sich anders als bei jemandem, der offensichtlich improvisiert. Und falls es zur Beschwerde kommt: genau diese Mappe ist die Grundlage für den Brief, den Einspruch für dich schreibt.",
        },
      ]}
      ctaGo="gemeinde"
      ctaLabel="Brief mit Fristsetzung erstellen"
    />
  );
}
