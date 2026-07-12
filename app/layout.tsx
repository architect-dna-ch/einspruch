import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Einspruch — Einsprache Brief Vorlage Schweiz | KK, Vermieter, Behörde",
  description: "Einsprache gegen Krankenkasse, Vermieter oder Behörde schreiben — mit korrekten Gesetzesartikeln (KVG, OR, ATSG). Kostenlos testen. Fertig in 60 Sekunden.",
  keywords: [
    "Einsprache Krankenkasse Muster Schweiz",
    "Beschwerde Brief Vorlage Schweiz",
    "Einsprache schreiben KVG",
    "Krankenkasse abgelehnt Brief",
    "Beschwerde Vermieter Schweiz Vorlage",
    "Einsprache Sozialdienst Brief",
    "AHV Einsprache Muster",
    "formeller Brief Behörde Schweiz",
  ],
  openGraph: {
    title: "Einspruch — Einsprache Brief in 60 Sekunden",
    description: "Krankenkasse, Vermieter oder Behörde zurückschreiben — mit KVG/OR-Artikeln, Frist und juristischem Ton. Kostenlos testen.",
    url: "https://einspruch.architect-dna.ch",
    type: "website",
    images: [{ url: "https://einspruch.architect-dna.ch/og.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["https://einspruch.architect-dna.ch/og.png"] },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://einspruch.architect-dna.ch" },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Einspruch" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#18181b" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js')); }`,
          }}
        />
      </body>
    </html>
  );
}
