"use client";

const CATEGORIES = [
  { icon: "📤", title: "Anträge & Gesuche", hint: "Was du eingereicht hast — mit Versanddatum." },
  { icon: "📥", title: "Antworten & Verfügungen", hint: "Jede Reaktion, auch ein knappes Nein." },
  { icon: "⏳", title: "Fristen", hint: "Ereignis, Ablauf, was zu tun ist." },
  { icon: "💳", title: "Zahlungen", hint: "Belege, Kontoauszüge, Mahnungen." },
  { icon: "💬", title: "Kommunikation", hint: "Telefonnotizen — Datum, Person, Inhalt." },
];

export default function BelegmappeClient() {
  return (
    <main className="max-w-lg mx-auto px-5 py-14">
      <a href="/" className="text-sm mb-8 block" style={{ color: "var(--ink-3)" }}>← Einspruch</a>
      <p className="kicker mb-3">Belegmappe</p>
      <h1 className="display text-4xl mb-3" style={{ color: "var(--ink)" }}>
        Beweise <em>sammeln</em>
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-3)" }}>Ein Ordner. Fünf Kategorien. Fertig.</p>

      <div className="space-y-2 mb-8">
        {CATEGORIES.map((c) => (
          <div key={c.title} className="card flex items-center gap-4 p-4">
            <div className="text-3xl">{c.icon}</div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{c.title}</div>
              <div className="text-xs" style={{ color: "var(--ink-3)" }}>{c.hint}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 mb-8">
        <div className="card flex items-center gap-3 px-4 py-3">
          <span className="text-xl">🗂️</span>
          <span className="text-sm" style={{ color: "var(--ink-2)" }}>
            <strong style={{ color: "var(--brass-hi)" }}>Dateiname:</strong> JJJJ-MM-TT_Kurzname → sortiert sich selbst.
          </span>
        </div>
        <div className="card flex items-center gap-3 px-4 py-3">
          <span className="text-xl">✍️</span>
          <span className="text-sm" style={{ color: "var(--ink-2)" }}>
            <strong style={{ color: "var(--brass-hi)" }}>Nach jedem Telefonat:</strong> sofort notieren.
          </span>
        </div>
      </div>

      <div className="card p-6 text-center">
        <p className="text-sm mb-4" style={{ color: "var(--ink-3)" }}>Einspruch schreibt den Brief — in 60 Sekunden.</p>
        <a href="/?go=gemeinde" className="btn btn-primary px-8 py-3.5 text-sm">Brief mit Fristsetzung erstellen →</a>
      </div>
    </main>
  );
}
