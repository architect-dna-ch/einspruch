"use client";

import Deck from "../Deck";
import { useLang, LangSwitch } from "@/app/lib/lang";

const CATEGORIES = [
  { icon: "📤", title: ["Applications & requests", "Anträge & Gesuche"], hint: ["What you submitted — with the date you sent it.", "Was du eingereicht hast — mit Versanddatum."] },
  { icon: "📥", title: ["Replies", "Antworten"], hint: ["Every response, even a curt no.", "Jede Reaktion, auch ein knappes Nein."] },
  { icon: "⏳", title: ["Deadlines", "Fristen"], hint: ["Event, expiry, what to do.", "Ereignis, Ablauf, was zu tun ist."] },
  { icon: "💳", title: ["Payments", "Zahlungen"], hint: ["Receipts, bank statements, reminders.", "Belege, Kontoauszüge, Mahnungen."] },
  { icon: "💬", title: ["Communication", "Kommunikation"], hint: ["Phone notes — date, person, content.", "Telefonnotizen — Datum, Person, Inhalt."] },
];

export default function BelegmappeClient() {
  const { de, t, toggle } = useLang();
  return (
    <main className="max-w-lg mx-auto px-5 py-14">
      <LangSwitch de={de} toggle={toggle} />
      <a href="/" className="text-sm mb-8 block" style={{ color: "var(--ink-3)" }}>← Einspruch</a>
      <p className="kicker mb-3">{t("Evidence folder", "Belegmappe")}</p>
      <h1 className="display text-4xl mb-3" style={{ color: "var(--ink)" }}>
        {de ? <>Beweise <em>sammeln</em></> : <>Collect <em>evidence</em></>}
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-3)" }}>{t("One folder. Five categories. Swipe through.", "Ein Ordner. Fünf Kategorien. Wisch durch.")}</p>

      <div className="mb-10">
        <Deck
          label={t("The five categories", "Die fünf Kategorien")}
          cards={CATEGORIES.map((c, n) => (
            <div className="card p-8 text-center" key={c.title[1]} style={{ minHeight: 260 }}>
              <div className="text-6xl mb-5">{c.icon}</div>
              <p className="kicker mb-2">{t(`Folder ${n + 1} of ${CATEGORIES.length}`, `Ordner ${n + 1} von ${CATEGORIES.length}`)}</p>
              <div className="display text-2xl mb-2" style={{ color: "var(--ink)" }}>{de ? c.title[1] : c.title[0]}</div>
              <p className="text-sm" style={{ color: "var(--ink-2)" }}>{de ? c.hint[1] : c.hint[0]}</p>
            </div>
          ))}
        />
      </div>

      <div className="space-y-2 mb-8">
        <div className="card flex items-center gap-3 px-4 py-3">
          <span className="text-xl">🗂️</span>
          <span className="text-sm" style={{ color: "var(--ink-2)" }}>
            <strong style={{ color: "var(--brass-hi)" }}>{t("File name:", "Dateiname:")}</strong> {t("YYYY-MM-DD_shortname → sorts itself.", "JJJJ-MM-TT_Kurzname → sortiert sich selbst.")}
          </span>
        </div>
        <div className="card flex items-center gap-3 px-4 py-3">
          <span className="text-xl">✍️</span>
          <span className="text-sm" style={{ color: "var(--ink-2)" }}>
            <strong style={{ color: "var(--brass-hi)" }}>{t("After every phone call:", "Nach jedem Telefonat:")}</strong> {t("write it down right away.", "sofort notieren.")}
          </span>
        </div>
      </div>

      <div className="card p-6 text-center">
        <p className="text-sm mb-4" style={{ color: "var(--ink-3)" }}>{t("Einspruch writes the letter — in 60 seconds.", "Einspruch schreibt den Brief — in 60 Sekunden.")}</p>
        <a href="/?go=gemeinde" className="btn btn-primary px-8 py-3.5 text-sm">{t("Write a letter with a deadline →", "Brief mit Fristsetzung erstellen →")}</a>
      </div>
    </main>
  );
}
