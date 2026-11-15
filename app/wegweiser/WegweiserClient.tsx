"use client";

import { useState } from "react";
import Deck from "../Deck";
import { useLang, LangSwitch } from "@/app/lib/lang";

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


const AREAS_EN: Record<string, Omit<Area, "id" | "recipientGo">> = {
  sozialhilfe: {
    label: "🏛️ Social assistance / social services",
    authority: "Municipal social services (usually at your place of residence)",
    oversight: "Cantonal social office or cantonal supervisory authority for social assistance; for delays also the prefect's office (Statthalteramt)",
    nextStep: "Demand a written, appealable decision → if refused, appeal to the cantonal social-assistance appeals body (named differently by canton, e.g. social office, administrative court)",
  },
  iv: {
    label: "📋 IV (disability insurance)",
    authority: "Cantonal IV office",
    oversight: "Federal Social Insurance Office (BSV); the appeals body is the cantonal social insurance court",
    nextStep: "Object to the preliminary decision/decision within 30 days at the IV office that issued it, then appeal to the cantonal social insurance court",
  },
  krankenkasse: {
    label: "🏥 Health insurer (KVG)",
    authority: "Your health insurer (basic insurance)",
    oversight: "Federal Office of Public Health (BAG); disputes go to the cantonal social insurance court",
    nextStep: "Object with the insurer itself (ATSG Art. 52) → if the objection is rejected, appeal to the cantonal social insurance court",
  },
  alv: {
    label: "💼 ALV / RAV (unemployment)",
    authority: "RAV (counselling) and the cantonal office / unemployment fund (benefit decisions)",
    oversight: "State Secretariat for Economic Affairs (SECO); the appeals body is the cantonal social insurance court",
    nextStep: "Object to the fund's decision within 30 days, then appeal to the cantonal social insurance court",
  },
  migration: {
    label: "🛂 Migration / residence",
    authority: "Cantonal migration office (permits) or State Secretariat for Migration SEM (asylum, entry)",
    oversight: "Cantonal decisions: cantonal administrative court. SEM decisions: Federal Administrative Court",
    nextStep: "Demand an appealable decision if you only got a verbal answer → appeal within the deadline stated on the decision (usually 30 days) at the competent court",
  },
};

export default function WegweiserClient() {
  const { de, t, toggle } = useLang();
  const L = (a: Area) => (de ? a : { ...a, ...AREAS_EN[a.id] });
  const [openId, setOpenId] = useState<string>(AREAS[0].id);
  const found = AREAS.find((a) => a.id === openId);
  const active = found ? L(found) : undefined;

  return (
    <main className="max-w-2xl mx-auto px-5 py-14">
      <LangSwitch de={de} toggle={toggle} />
      <a href="/" className="text-sm mb-8 block" style={{ color: "var(--ink-3)" }}>← Einspruch</a>
      <p className="kicker mb-3">{t("Signpost", "Wegweiser")}</p>
      <h1 className="display text-4xl mb-3" style={{ color: "var(--ink)" }}>
        {de ? <>Wer ist <em>zuständig</em>?</> : <>Who is <em>responsible</em>?</>}
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-3)" }}>{t("Pick your area — office, oversight, next step. Swiss authorities.", "Wähle deinen Bereich — Stelle, Aufsicht, nächster Schritt.")}</p>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {AREAS.map((a) => (
          <button key={a.id} onClick={() => setOpenId(a.id)} className={`tile px-4 py-3.5 ${openId === a.id ? "on" : ""}`}>
            <div className="text-2xl mb-1">{L(a).label.split(" ")[0]}</div>
            <div className="t text-sm">{L(a).label.split(" ").slice(1).join(" ")}</div>
          </button>
        ))}
      </div>

      {active && (
        <div className="mb-6">
          <Deck
            label={t(`Path for ${active.label}`, `Weg für ${active.label}`)}
            cards={[
              <div className="card p-6" key="a">
                <p className="kicker mb-2">{t("Step 1 · Responsible office", "Schritt 1 · Zuständige Stelle")}</p>
                <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{active.authority}</p>
              </div>,
              <div className="card p-6" key="b">
                <p className="kicker mb-2">{t("Step 2 · Oversight", "Schritt 2 · Aufsicht")}</p>
                <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{active.oversight}</p>
              </div>,
              <div className="card p-6" key="c">
                <p className="kicker mb-2">{t("Step 3 · Next step", "Schritt 3 · Nächster Schritt")}</p>
                <p className="text-[15px] leading-relaxed mb-4" style={{ color: "var(--ink-2)" }}>{active.nextStep}</p>
                <a href={`/?go=${active.recipientGo}`} className="btn btn-primary px-6 py-3 text-sm">{t("Write a letter →", "Brief erstellen →")}</a>
              </div>,
            ]}
          />
        </div>
      )}

      <div className="flex gap-2">
        <a href="/fristenrechner" className="btn flex-1 text-center px-4 py-3 text-sm">{t("⏱️ Deadline calculator →", "⏱️ Fristenrechner →")}</a>
        <a href="/belegmappe" className="btn flex-1 text-center px-4 py-3 text-sm">{t("📁 Evidence folder →", "📁 Belegmappe →")}</a>
      </div>
    </main>
  );
}
