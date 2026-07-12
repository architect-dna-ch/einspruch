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
      <a href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-8 block">← Einspruch</a>
      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">{kicker}</p>
      <h1 className="text-3xl font-bold text-zinc-900 mb-6 leading-tight">{title}</h1>
      <p className="text-zinc-600 text-[15px] leading-relaxed mb-10">{intro}</p>

      {sections.map((s) => (
        <div key={s.heading} className="mb-8">
          <h2 className="text-lg font-bold text-zinc-900 mb-2">{s.heading}</h2>
          <p className="text-zinc-600 text-[15px] leading-relaxed whitespace-pre-line">{s.body}</p>
        </div>
      ))}

      <div className="mt-12 p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-center">
        <p className="text-sm text-zinc-500 mb-4">Einspruch schreibt den Brief für dich — mit den passenden Gesetzesartikeln, in 60 Sekunden.</p>
        <a href={`/?go=${ctaGo}`} className="inline-block px-8 py-3.5 rounded-xl font-semibold bg-zinc-900 hover:bg-zinc-700 text-white transition-colors text-sm">
          {ctaLabel} →
        </a>
        <p className="text-xs text-zinc-400 mt-3">Kostenlos testen · Kein Konto nötig</p>
      </div>
    </main>
  );
}
