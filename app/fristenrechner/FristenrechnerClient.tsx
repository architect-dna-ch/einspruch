"use client";

import { useMemo, useState } from "react";

const PRESETS = [
  { id: "30", label: "30 Tage — Standard (Verwaltungs-/Sozialversicherungsbeschwerde, VwVG/ATSG)", days: 30 },
  { id: "20", label: "20 Tage — kürzere kantonale Verfahrensfristen (prüfe die Verfügung)", days: 20 },
  { id: "14", label: "14 Tage — eigene Fristsetzung in einem Schreiben", days: 14 },
  { id: "10", label: "10 Tage — Ordnungsbusse laut OBG (steht auf dem Bussenzettel — dort prüfen)", days: 10 },
  { id: "custom", label: "Andere — steht auf der Verfügung", days: 0 },
];

function fmt(d: Date) {
  return d.toLocaleDateString("de-CH", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export default function FristenrechnerClient() {
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [presetId, setPresetId] = useState("30");
  const [customDays, setCustomDays] = useState(30);
  const [hasBelehrung, setHasBelehrung] = useState(true);

  const days = presetId === "custom" ? customDays : PRESETS.find((p) => p.id === presetId)!.days;

  const result = useMemo(() => {
    if (!dateStr || !days) return null;
    const start = new Date(dateStr + "T00:00:00");
    if (isNaN(start.getTime())) return null;

    // Art. 20 Abs. 1 VwVG: der Tag der Zustellung wird nicht mitgezählt — die
    // Frist läuft ab dem Folgetag; ihr letzter Tag liegt N Tage nach Zustellung.
    let end = new Date(start);
    end.setDate(end.getDate() + days);

    // Art. 20 Abs. 3 VwVG: fällt das Ende auf Samstag/Sonntag/einen eidgenössischen
    // Feiertag, läuft die Frist bis zum nächsten Werktag. Kantonale/lokale Feiertage
    // sind hier nicht erfasst — im Zweifel selbst prüfen.
    let shifted = false;
    while (end.getDay() === 0 || end.getDay() === 6) {
      end.setDate(end.getDate() + 1);
      shifted = true;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const remainingMs = end.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / 86400000);

    return { end, shifted, remainingDays };
  }, [dateStr, days]);

  return (
    <main className="max-w-lg mx-auto px-5 py-14">
      <a href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-8 block">← Einspruch</a>
      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Fristenrechner</p>
      <h1 className="text-3xl font-bold text-zinc-900 mb-4 leading-tight">Wann läuft deine Frist ab?</h1>
      <p className="text-zinc-600 text-[15px] leading-relaxed mb-8">
        Fristen laufen still — dreissig Tage, keine Erinnerung. Trag das Datum der Verfügung oder Zustellung ein und wähle die Fristart.
        Die genaue Frist steht immer auf der Verfügung selbst; ist sie dort anders angegeben, gilt diese.
      </p>

      <div className="mb-5">
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Datum der Verfügung / Zustellung
        </label>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <div className="mb-5">
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Fristart</label>
        <div className="space-y-2">
          {PRESETS.map((p) => (
            <label key={p.id} className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm cursor-pointer transition-colors ${
              presetId === p.id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"
            }`}>
              <input type="radio" className="mt-0.5" name="preset" checked={presetId === p.id} onChange={() => setPresetId(p.id)} />
              <span className="text-zinc-700">{p.label}</span>
            </label>
          ))}
        </div>
        {presetId === "custom" && (
          <input
            type="number"
            min={1}
            value={customDays}
            onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
            className="mt-2 w-32 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 transition-colors"
          />
        )}
      </div>

      <label className="mb-6 flex items-start gap-2.5 text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 cursor-pointer">
        <input type="checkbox" className="mt-0.5" checked={hasBelehrung} onChange={(e) => setHasBelehrung(e.target.checked)} />
        <span>Die Verfügung enthält eine korrekte, schriftliche Rechtsmittelbelehrung (Instanz, Frist, Form genannt)</span>
      </label>

      {result && (
        <div className="p-6 bg-white border border-zinc-200 rounded-2xl mb-6">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Frist läuft ab am</div>
          <div className="text-xl font-bold text-zinc-900 mb-1">{fmt(result.end)}</div>
          {result.shifted && (
            <p className="text-xs text-zinc-500 mb-3">Fiel rechnerisch auf ein Wochenende — auf den nächsten Werktag verschoben (Art. 20 Abs. 3 VwVG). Eidgenössische und kantonale Feiertage sind hier nicht erfasst; prüfe das im Zweifel selbst.</p>
          )}
          <div className={`text-sm font-semibold ${result.remainingDays < 0 ? "text-red-600" : result.remainingDays <= 5 ? "text-amber-600" : "text-zinc-600"}`}>
            {result.remainingDays < 0
              ? `Abgelaufen vor ${Math.abs(result.remainingDays)} Tag${Math.abs(result.remainingDays) === 1 ? "" : "en"}`
              : result.remainingDays === 0
              ? "Läuft heute ab"
              : `Noch ${result.remainingDays} Tag${result.remainingDays === 1 ? "" : "e"}`}
          </div>
        </div>
      )}

      {!hasBelehrung && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Fehlt die Rechtsmittelbelehrung oder ist sie falsch, darf dir das nicht zum Nachteil gereichen (Art. 38 VwVG).</strong>{" "}
            In der Praxis wird dir dann oft eine deutlich längere Nachfrist eingeräumt — aber das ist kein Freibrief. Verlasse dich nicht darauf:
            verlange die korrekte, schriftliche Verfügung so schnell wie möglich, statt auf eine unbestimmte längere Frist zu hoffen.
          </p>
        </div>
      )}

      <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-center">
        <p className="text-sm text-zinc-500 mb-4">Noch keine schriftliche Verfügung erhalten? Erzwinge zuerst eine.</p>
        <a href="/?go=gemeinde" className="inline-block px-8 py-3.5 rounded-xl font-semibold bg-zinc-900 hover:bg-zinc-700 text-white transition-colors text-sm">
          Anfechtbare Verfügung verlangen →
        </a>
      </div>
    </main>
  );
}
