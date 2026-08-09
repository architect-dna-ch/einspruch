"use client";

import Deck from "./Deck";

interface Section { heading: string; body: string }
interface Props {
  kicker: string;
  title: string;
  intro: string;
  sections: Section[];
  ctaGo: string;
  ctaLabel: string;
}

/* Every section stays in the DOM — the deck only moves them out of view, so the
 * page still reads as one document to a crawler while a visitor gets one card. */
export default function GuidePage({ kicker, title, intro, sections, ctaGo, ctaLabel }: Props) {
  return (
    <main className="max-w-lg mx-auto px-5 py-14">
      <a href="/" className="text-sm mb-8 block" style={{ color: "var(--ink-3)" }}>← Einspruch</a>
      <p className="kicker mb-3">{kicker}</p>
      <h1 className="display text-4xl mb-4 leading-tight" style={{ color: "var(--ink)" }}>{title}</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-3)" }}>Wisch durch — {sections.length} Karten.</p>

      <div className="mb-10">
        <Deck
          label={title}
          cards={[
            <article className="card p-7" key="intro" style={{ minHeight: 300 }}>
              <p className="kicker mb-3">Worum es geht</p>
              <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{intro}</p>
            </article>,
            ...sections.map((s, n) => (
              <article className="card p-7" key={s.heading} style={{ minHeight: 300 }}>
                <p className="kicker mb-3">{n + 1} von {sections.length}</p>
                <h2 className="display text-2xl mb-3" style={{ color: "var(--ink)" }}>{s.heading}</h2>
                <p className="text-[15px] leading-relaxed whitespace-pre-line" style={{ color: "var(--ink-2)" }}>{s.body}</p>
              </article>
            )),
            <article className="card p-7 text-center flex flex-col justify-center" key="cta" style={{ minHeight: 300 }}>
              <p className="kicker mb-3">Bereit</p>
              <p className="text-sm mb-5" style={{ color: "var(--ink-2)" }}>
                Einspruch schreibt den Brief — mit den passenden Gesetzesartikeln.
              </p>
              <a href={`/?go=${ctaGo}`} className="btn btn-primary px-6 py-3.5 text-sm mx-auto">{ctaLabel} →</a>
              <p className="text-xs mt-3" style={{ color: "var(--ink-3)" }}>Kostenlos · Kein Konto</p>
            </article>,
          ]}
        />
      </div>

      <div className="flex gap-2">
        <a href="/fristenrechner" className="btn flex-1 text-center px-4 py-3 text-sm">⏱️ Frist</a>
        <a href="/wegweiser" className="btn flex-1 text-center px-4 py-3 text-sm">🧭 Wegweiser</a>
        <a href="/belegmappe" className="btn flex-1 text-center px-4 py-3 text-sm">📁 Belege</a>
      </div>
    </main>
  );
}
