import type { Metadata } from "next";
import BelegmappeClient from "./BelegmappeClient";

export const metadata: Metadata = {
  title: "Belegmappe — Beweise sammeln, bevor du sie brauchst | Einspruch",
  description: "Fünf Kategorien, ein Ordner: so dokumentierst du deinen Fall, damit du im Streit sofort belegen kannst, was passiert ist.",
  alternates: { canonical: "https://einspruch.architect-dna.ch/belegmappe" },
};

export default function Page() {
  return <BelegmappeClient />;
}
