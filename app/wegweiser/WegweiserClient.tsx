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
  const [openId, setOpenId] = useState<string | null>(AREAS[0].id);

  return (
    <main className="max-w-2xl mx-auto px-5 py-14">
      <a href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-8 block">← Einspruch</a>
      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Wegweiser</p>
      <h1 className="text-3xl font-bold text-zinc-900 mb-4 leading-tight">Welche Behörde? Welche Aufsicht? Welcher nächste Schritt?</h1>
      <p className="text-zinc-600 text-[15px] leading-relaxed mb-8">
        Wähle deinen Bereich. Die Zuständigkeiten sind kantonal teils unterschiedlich benannt — das hier ist die grundsätzliche Kette,
        keine Rechtsberatung für deinen konkreten Kanton.
      </p>

      <div className="space-y-3">
        {AREAS.map((a) => {
          const open = openId === a.id;
          return (
            <div key={a.id} className="border border-zinc-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : a.id)}
                className="w-full text-left px-5 py-4 flex items-center justify-between bg-white hover:bg-zinc-50 transition-colors"
              >
                <span className="font-semibold text-zinc-900 text-sm">{a.label}</span>
                <span className="text-zinc-400 text-sm">{open ? "−" : "+"}</span>
              </button>
              {open && (
                <div className="px-5 pb-5 pt-1 bg-white space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Zuständige Stelle</div>
                    <p className="text-sm text-zinc-700 leading-relaxed">{a.authority}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Aufsicht / Beschwerdeinstanz</div>
                    <p className="text-sm text-zinc-700 leading-relaxed">{a.oversight}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Nächster Schritt</div>
                    <p className="text-sm text-zinc-700 leading-relaxed">{a.nextStep}</p>
                  </div>
                  <a
                    href={`/?go=${a.recipientGo}`}
                    className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 hover:bg-zinc-700 text-white transition-colors"
                  >
                    Brief für diesen Bereich erstellen →
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex gap-3">
        <a href="/fristenrechner" className="flex-1 text-center px-4 py-3 rounded-xl text-sm border border-zinc-200 hover:border-zinc-400 text-zinc-600 transition-colors">Fristenrechner →</a>
        <a href="/belegmappe" className="flex-1 text-center px-4 py-3 rounded-xl text-sm border border-zinc-200 hover:border-zinc-400 text-zinc-600 transition-colors">Belegmappe →</a>
      </div>
    </main>
  );
}
