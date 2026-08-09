"use client";

import { useMemo, useState } from "react";

const PRESETS = [
  { id: "30", icon: "⚖️", title: "Standard", sub: "30 Tage", days: 30 },
  { id: "20", icon: "🏛️", title: "Kantonal", sub: "20 Tage", days: 20 },
  { id: "14", icon: "✍️", title: "Eigene Frist", sub: "14 Tage", days: 14 },
  { id: "10", icon: "🚗", title: "Ordnungsbusse", sub: "10 Tage", days: 10 },
  { id: "custom", icon: "⚙️", title: "Andere", sub: "selbst eingeben", days: 0 },
];

function fmt(d: Date) {
  return d.toLocaleDateString("de-CH", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export default function FristenrechnerClient() {
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [presetId, setPresetId] = useState("30");
  const [customDays, setCustomDays] = useState(30);
  const [hasBelehrung, setHasBelehrung] = useState<boolean | null>(true);

  const days = presetId === "custom" ? customDays : PRESETS.find((p) => p.id === presetId)!.days;

  const result = useMemo(() => {
    if (!dateStr || !days) return null;
    const start = new Date(dateStr + "T00:00:00");
    if (isNaN(start.getTime())) return null;

    // Art. 20 Abs. 1 VwVG: der Tag der Zustellung wird nicht mitgezählt — die
    // Frist läuft ab dem Folgetag; ihr letzter Tag liegt N Tage nach Zustellung.
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    // Art. 20 Abs. 3 VwVG: fällt das Ende auf ein Wochenende, läuft die Frist bis
    // zum nächsten Werktag. Feiertage sind hier nicht erfasst.
    let shifted = false;
    while (end.getDay() === 0 || end.getDay() === 6) {
      end.setDate(end.getDate() + 1);
      shifted = true;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const remainingDays = Math.ceil((end.getTime() - now.getTime()) / 86400000);

    return { end, shifted, remainingDays };
  }, [dateStr, days]);

  const urgency =
    !result ? "" : result.remainingDays < 0 ? "var(--r2, #d95926)" : result.remainingDays <= 5 ? "var(--brass)" : "var(--verdigris)";

  return (
    <main className="max-w-lg mx-auto px-5 py-14">
      <a href="/" className="text-sm mb-8 block" style={{ color: "var(--ink-3)" }}>← Einspruch</a>
      <p className="kicker mb-3">Fristenrechner</p>
      <h1 className="display text-4xl mb-3" style={{ color: "var(--ink)" }}>
        Wann läuft deine <em>Frist</em> ab?
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-3)" }}>
        Fristen laufen still. Datum rein — Ablauf raus.
      </p>

      <div className="mb-6">
        <p className="kicker mb-2">Datum der Verfügung</p>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="field flex-1 px-4 py-3 text-base"
          />
          <button onClick={() => setDateStr(new Date().toISOString().slice(0, 10))} className="btn px-4 py-3 text-sm">
            Heute
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="kicker mb-2">Fristart</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => setPresetId(p.id)} className={`tile px-4 py-3.5 ${presetId === p.id ? "on" : ""}`}>
              <div className="text-2xl mb-1">{p.icon}</div>
              <div className="t text-sm">{p.title}</div>
              <div className="s">{p.sub}</div>
            </button>
          ))}
        </div>
        {presetId === "custom" && (
          <div className="mt-3 flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={customDays}
              onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
              className="field w-24 px-4 py-2.5 text-base"
            />
            <span className="text-sm" style={{ color: "var(--ink-3)" }}>Tage</span>
          </div>
        )}
      </div>

      <div className="mb-6">
        <p className="kicker mb-2">Rechtsmittelbelehrung</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setHasBelehrung(true)} className={`tile px-4 py-3.5 ${hasBelehrung === true ? "on" : ""}`}>
            <div className="text-2xl mb-1">✅</div>
            <div className="t text-sm">Vorhanden</div>
          </button>
          <button onClick={() => setHasBelehrung(false)} className={`tile px-4 py-3.5 ${hasBelehrung === false ? "on" : ""}`}>
            <div className="text-2xl mb-1">⚠️</div>
            <div className="t text-sm">Fehlt</div>
          </button>
        </div>
      </div>

      {result && (
        <div className="card p-6 mb-6">
          <p className="kicker mb-2">Frist läuft ab am</p>
          <div className="display text-2xl mb-2" style={{ color: "var(--ink)" }}>{fmt(result.end)}</div>
          <div className="coords text-sm font-semibold" style={{ color: urgency }}>
            {result.remainingDays < 0
              ? `abgelaufen vor ${Math.abs(result.remainingDays)} Tagen`
              : result.remainingDays === 0
              ? "läuft heute ab"
              : `noch ${result.remainingDays} Tag${result.remainingDays === 1 ? "" : "e"}`}
          </div>
          {result.shifted && (
            <p className="text-xs mt-3" style={{ color: "var(--ink-3)" }}>
              Auf den nächsten Werktag verschoben (Art. 20 Abs. 3 VwVG). Feiertage sind hier nicht erfasst.
            </p>
          )}
        </div>
      )}

      {hasBelehrung === false && (
        <div className="card p-4 mb-6" style={{ borderColor: "var(--brass)" }}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
            <strong style={{ color: "var(--brass-hi)" }}>Fehlt die Belehrung, darf dir das nicht schaden (Art. 38 VwVG).</strong>{" "}
            Oft gibt es dann eine längere Nachfrist — aber verlass dich nicht darauf. Verlange die korrekte Verfügung sofort.
          </p>
        </div>
      )}

      <div className="card p-6 text-center">
        <p className="text-sm mb-4" style={{ color: "var(--ink-3)" }}>Noch keine schriftliche Verfügung?</p>
        <a href="/?go=gemeinde" className="btn btn-primary px-8 py-3.5 text-sm">Anfechtbare Verfügung verlangen →</a>
      </div>
    </main>
  );
}
