import type { Metadata } from "next";
import FallpruefungClient from "./FallpruefungClient";

export const metadata: Metadata = {
  title: "Fallprüfung — Lohnt sich das Kämpfen? Kostenlose Ersteinschätzung | Einspruch",
  description: "Krankenkasse, Vermieter, Bank oder Behörde schulden dir Geld? Kostenlose KI-Ersteinschätzung deiner Chancen, dann optional persönliche Prüfung ab CHF 5.",
  alternates: { canonical: "https://einspruch.architect-dna.ch/fallpruefung" },
};

export default function Page() {
  return <FallpruefungClient />;
}
