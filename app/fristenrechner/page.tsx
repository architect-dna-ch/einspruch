import type { Metadata } from "next";
import FristenrechnerClient from "./FristenrechnerClient";

export const metadata: Metadata = {
  title: "Fristenrechner — Beschwerdefrist berechnen | Einspruch",
  description: "Datum der Verfügung eingeben, Ablauf der Beschwerdefrist berechnen — mit Warnung, falls die Rechtsmittelbelehrung fehlt.",
  alternates: { canonical: "https://einspruch.architect-dna.ch/fristenrechner" },
};

export default function Page() {
  return <FristenrechnerClient />;
}
