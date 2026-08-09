"use client";

import { useState } from "react";

interface Area {
  id: string;
  label: string;
  authority: string;
  oversight: string;
  nextStep: string;
  recipientGo: string;
}

const AREAS: Area[] = [
  {
    id: "sozialhilfe",
    label: "🏛️ Sozialhilfe / Sozialdienst",
    authority: "Kommunaler Sozialdienst (meist bei der Wohnsitzgemeinde)",
    oversight: "Kantonales Sozialamt bzw. kantonale Aufsichtsbehörde über die Sozialhilfe; bei Rechtsverzögerung auch das Statthalteramt/der Regierungsstatthalter",
    nextStep: "Schriftliche, anfechtbare Verfügung verlangen → bei Ablehnung Beschwerde an die kantonale Sozialhilfe-Beschwerdeinstanz (kantonal unterschiedlich benannt, z.B. Sozialamt, Verwaltungsgericht)",
    recipientGo: "gemeinde",
  },
  {
    id: "iv",
    label: "📋 IV (Invalidenversicherung)",
    authority: "Kantonale IV-Stelle",
    oversight: "Bundesamt für Sozialversicherungen (BSV); Beschwerdeinstanz ist das kantonale Sozialversicherungsgericht",
    nextStep: "Einsprache gegen den Vorbescheid/die Verfügung innert 30 Tagen bei der verfügenden IV-Stelle, danach Beschwerde ans kantonale Sozialversicherungsgericht",
    recipientGo: "ahv",
  },
  {
    id: "krankenkasse",
    label: "🏥 Krankenkasse (KVG)",
    authority: "Deine Krankenkasse (Grundversicherung)",
    oversight: "Bundesamt für Gesundheit (BAG); bei Streit ist das kantonale Sozialversicherungsgericht zuständig",
    nextStep: "Einsprache bei der Krankenkasse selbst (ATSG Art. 52) → bei ablehnendem Einspracheentscheid Beschwerde ans kantonale Sozialversicherungsgericht",
    recipientGo: "kk",
  },
  {
    id: "alv",
    label: "💼 ALV / RAV (Arbeitslosigkeit)",
    authority: "RAV (Beratung) und kantonale Amtsstelle / Arbeitslosenkasse (Leistungsentscheide)",
    oversight: "Staatssekretariat für Wirtschaft (SECO); Beschwerdeinstanz ist das kantonale Sozialversicherungsgericht",
    nextStep: "Einsprache gegen den Kassenentscheid innert 30 Tagen, danach Beschwerde ans kantonale Sozialversicherungsgericht",
    recipientGo: "gemeinde",
  },
  {
    id: "migration",
    label: "🛂 Migration / Aufenthalt",
    authority: "Kantonales Migrationsamt (Bewilligungen) bzw. Staatssekretariat für Migration SEM (Asyl, Einreise)",
    oversight: "Bei kantonalen Entscheiden: kantonales Verwaltungsgericht. Bei SEM-Entscheiden: Bundesverwaltungsgericht",
    nextStep: "Anfechtbare Verfügung verlangen, falls nur mündlich beschieden → Beschwerde innert der auf der Verfügung angegebenen Frist (meist 30 Tage) beim zuständigen Gericht",
    recipientGo: "gemeinde",
  },
];

export default function WegweiserClient() {
  const [openId, setOpenId] = useState<string>(AREAS[0].id);
  const active = AREAS.find((a) => a.id === openId);

  return (
    <main className="max-w-2xl mx-auto px-5 py-14">
      <a href="/" className="text-sm mb-8 block" style={{ color: "var(--ink-3)" }}>← Einspruch</a>
      <p className="kicker mb-3">Wegweiser</p>
      <h1 className="display text-4xl mb-3" style={{ color: "var(--ink)" }}>
        Wer ist <em>zuständig</em>?
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-3)" }}>Wähle deinen Bereich — Stelle, Aufsicht, nächster Schritt.</p>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {AREAS.map((a) => (
          <button key={a.id} onClick={() => setOpenId(a.id)} className={`tile px-4 py-3.5 ${openId === a.id ? "on" : ""}`}>
            <div className="text-2xl mb-1">{a.label.split(" ")[0]}</div>
            <div className="t text-sm">{a.label.split(" ").slice(1).join(" ")}</div>
          </button>
        ))}
      </div>

      {active && (
        <div className="card p-6 space-y-4 mb-6">
          <div>
            <p className="kicker mb-1">Zuständige Stelle</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>{active.authority}</p>
          </div>
          <div>
            <p className="kicker mb-1">Aufsicht / Beschwerdeinstanz</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>{active.oversight}</p>
          </div>
          <div>
            <p className="kicker mb-1">Nächster Schritt</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>{active.nextStep}</p>
          </div>
          <a href={`/?go=${active.recipientGo}`} className="btn btn-primary px-6 py-3 text-sm">Brief erstellen →</a>
        </div>
      )}

      <div className="flex gap-2">
        <a href="/fristenrechner" className="btn flex-1 text-center px-4 py-3 text-sm">⏱️ Fristenrechner →</a>
        <a href="/belegmappe" className="btn flex-1 text-center px-4 py-3 text-sm">📁 Belegmappe →</a>
      </div>
    </main>
  );
}
