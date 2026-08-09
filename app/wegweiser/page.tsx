import type { Metadata } from "next";
import WegweiserClient from "./WegweiserClient";

export const metadata: Metadata = {
  title: "Wegweiser — Welche Behörde, welche Aufsicht? | Einspruch",
  description: "Sozialhilfe, IV, Krankenkasse, Arbeitslosenversicherung, Migration: zuständige Stelle, Aufsichtsbehörde und nächster Schritt auf einen Blick.",
  alternates: { canonical: "https://einspruch.architect-dna.ch/wegweiser" },
};

export default function Page() {
  return <WegweiserClient />;
}
