"use client";

interface Section { heading: string; body: string }
interface Props {
  kicker: string;
  title: string;
  intro: string;
  sections: Section[];
  ctaGo: string;
  ctaLabel: string;
}

export default function GuidePage({ kicker, title, intro, sections, ctaGo, ctaLabel }: Props) {
  return (
    <main className="max-w-2xl mx-auto px-5 py-14">
      <a href="/" className="text-sm mb-8 block" style={{ color: "var(--ink-3)" }}>← Einspruch</a>
      <p className="kicker mb-3">{kicker}</p>
      <h1 className="display text-4xl mb-6 leading-tight" style={{ color: "var(--ink)" }}>{title}</h1>
      <p className="text-[15px] leading-relaxed mb-10" style={{ color: "var(--ink-2)" }}>{intro}</p>

      {sections.map((s) => (
        <div key={s.heading} className="card p-6 mb-3">
          <h2 className="display text-xl mb-2" style={{ color: "var(--ink)" }}>{s.heading}</h2>
          <p className="text-[15px] leading-relaxed whitespace-pre-line" style={{ color: "var(--ink-2)" }}>{s.body}</p>
        </div>
      ))}

      <div className="card p-6 mt-8 text-center">
        <p className="text-sm mb-4" style={{ color: "var(--ink-3)" }}>Einspruch schreibt den Brief — mit den passenden Gesetzesartikeln, in 60 Sekunden.</p>
        <a href={`/?go=${ctaGo}`} className="btn btn-primary px-8 py-3.5 text-sm">{ctaLabel} →</a>
        <p className="text-xs mt-3" style={{ color: "var(--ink-3)" }}>Kostenlos testen · Kein Konto nötig</p>
      </div>
    </main>
  );
}
