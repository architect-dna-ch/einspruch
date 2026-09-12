"use client";

import { useState, useEffect } from "react";

const KATEGORIEN = [
  { id: "kk",          label: "🏥 Krankenkasse" },
  { id: "vermieter",   label: "🏠 Vermieter" },
  { id: "bank",        label: "🏦 Bank / Versicherung" },
  { id: "behoerde",    label: "🏛️ Behörde / Gemeinde" },
  { id: "arbeitgeber", label: "💼 Arbeitgeber" },
  { id: "firma",       label: "📱 Firma / Abo" },
  { id: "andere",      label: "📝 Andere" },
];

type Chance = "gut" | "mittel" | "schwierig";

const CHANCE_META: Record<Chance, { label: string; color: string }> = {
  gut:       { label: "Gute Chancen",      color: "var(--verdigris)" },
  mittel:    { label: "Mittlere Chancen",  color: "var(--brass)" },
  schwierig: { label: "Schwieriger Fall",  color: "var(--ink-3)" },
};

function feeEstimate(betrag: number): { fee: string; rate: number; label: string } | null {
  if (!betrag || betrag <= 0) return null;
  if (betrag <= 200) return { fee: (betrag * 0.03).toFixed(2), rate: 3, label: "Kleiner Fall" };
  if (betrag <= 5000) return { fee: (betrag * 0.09).toFixed(2), rate: 9, label: "Mittlerer Fall" };
  return null;
}

export default function FallpruefungClient() {
  const [kategorie, setKategorie] = useState("kk");
  const [betrag, setBetrag] = useState("");
  const [situation, setSituation] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ chance: Chance; artikel: string[]; begruendung: string } | null>(null);
  const [checkError, setCheckError] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentDone(true);
      const sid = params.get("session_id");
      window.history.replaceState({}, "", "/fallpruefung");
      if (sid) {
        // Fallback in case the Stripe webhook doesn't fire. May duplicate the
        // notification email if the webhook also fires — acceptable at this volume.
        fetch("/api/notify-fallpruefung", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sid }),
        }).catch(() => {});
      }
    }
  }, []);

  async function runCheck() {
    if (!situation.trim() || checking) return;
    setChecking(true);
    setCheckError(false);
    try {
      const res = await fetch("/api/fallpruefung-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kategorie, betrag, situation }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch {
      setCheckError(true);
    } finally {
      setChecking(false);
    }
  }

  async function startCheckout() {
    if (!email.trim() || checkoutLoading) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout-fallpruefung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kategorie, betrag, situation, email, name }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setCheckoutLoading(false);
    } catch {
      setCheckoutLoading(false);
    }
  }

  const betragNum = parseFloat(betrag.replace(",", "."));
  const estimate = feeEstimate(betragNum);
  const overLimit = betragNum > 5000;

  if (paymentDone) {
    return (
      <main className="max-w-lg mx-auto px-5 py-16 text-center">
        <div className="text-5xl mb-6">✓</div>
        <h1 className="display text-3xl mb-3">Danke, ist eingegangen.</h1>
        <p className="text-sm mb-2" style={{ color: "var(--ink-2)" }}>
          Ich melde mich innert 2–3 Werktagen per E-Mail — mit einer ehrlichen Einschätzung: weiterverfolgen oder nicht, und warum.
        </p>
        <p className="text-xs mt-6" style={{ color: "var(--ink-3)" }}>
          Keine Antwort nach einer Woche? Schreib mir direkt an{" "}
          <a href="mailto:ma.akd@proton.me" className="underline">ma.akd@proton.me</a>.
        </p>
        <a href="/" className="text-sm mt-10 inline-block" style={{ color: "var(--ink-3)" }}>← Einspruch</a>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-5 py-14">
      <a href="/" className="text-sm mb-8 block" style={{ color: "var(--ink-3)" }}>← Einspruch</a>

      <p className="kicker mb-3">Einspruch · Fallprüfung</p>
      <h1 className="display text-4xl md:text-5xl leading-[1.05] mb-4">
        Lohnt sich das <em>Kämpfen</em>?
      </h1>
      <p className="text-sm mb-8 max-w-lg" style={{ color: "var(--ink-2)" }}>
        Beschreib deinen Fall — Krankenkasse, Vermieter, Bank, Behörde, egal wer.
        Du bekommst sofort und kostenlos eine ehrliche Einschätzung: gute Chancen,
        mittel, oder eher schwierig. Kein Konto, keine Zahlung, keine Verpflichtung.
      </p>

      {/* ── FREE CHECK ── */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {KATEGORIEN.map((k) => (
            <button
              key={k.id}
              onClick={() => setKategorie(k.id)}
              className={`tile px-3 py-3 text-center ${kategorie === k.id ? "on" : ""}`}
            >
              <div className="text-xl mb-1">{k.label.split(" ")[0]}</div>
              <div className="t text-xs">{k.label.split(" ").slice(1).join(" ")}</div>
            </button>
          ))}
        </div>

        <input
          type="text"
          inputMode="decimal"
          placeholder="Geschätzter Betrag in CHF (optional)"
          value={betrag}
          onChange={(e) => setBetrag(e.target.value)}
          className="w-full field px-4 py-2.5 text-sm mb-3"
        />

        <textarea
          placeholder="Was ist passiert? Ein paar Sätze reichen."
          value={situation}
          onChange={(e) => setSituation(e.target.value.slice(0, 600))}
          className="w-full field px-4 py-3 text-sm resize-none min-h-[110px] mb-1"
        />
        <p className="text-xs mb-4 text-right" style={{ color: "var(--ink-3)" }}>{situation.length}/600</p>

        <button
          onClick={runCheck}
          disabled={!situation.trim() || checking}
          className="btn btn-primary w-full py-3.5 text-sm font-semibold disabled:opacity-40"
        >
          {checking ? "Wird geprüft…" : "Kostenlos einschätzen →"}
        </button>
        {checkError && (
          <p className="text-xs mt-3 text-center" style={{ color: "var(--ink-3)" }}>
            Hat nicht geklappt — bitte nochmals versuchen.
          </p>
        )}
      </div>

      {/* ── RESULT ── */}
      {result && (
        <div className="card p-6 mb-6 fade-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHANCE_META[result.chance].color }} />
            <span className="font-semibold text-sm" style={{ color: CHANCE_META[result.chance].color }}>
              {CHANCE_META[result.chance].label}
            </span>
          </div>
          <p className="text-sm mb-4" style={{ color: "var(--ink)" }}>{result.begruendung}</p>
          {result.artikel.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {result.artikel.map((a) => (
                <span key={a} className="coords text-xs px-2.5 py-1 rounded-full" style={{ border: "1px solid var(--rule)" }}>
                  {a}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs mt-4" style={{ color: "var(--ink-3)" }}>
            Unverbindliche Ersteinschätzung durch KI, keine Rechtsberatung und keine Garantie.
          </p>
        </div>
      )}

      {/* ── PAID NEXT STEP ── */}
      {result && result.chance !== "schwierig" && (
        <div className="card p-6 fade-up">
          <p className="kicker mb-2">Nächster Schritt</p>
          <h2 className="display text-2xl mb-3">Ich schau's mir persönlich an</h2>
          <p className="text-sm mb-4" style={{ color: "var(--ink-2)" }}>
            Für CHF 5 lese ich deinen Fall selbst durch — kein Callcenter, keine Kanzlei,
            nur ich. Innert 2–3 Tagen bekommst du eine schriftliche Einschätzung: weiterverfolgen
            oder nicht, mit Begründung. Ich bin{" "}
            <strong style={{ color: "var(--ink)" }}>kein Anwalt</strong> und bleibe ein
            Einzelunternehmen — das hier ist keine Rechtsberatung, sondern praktische Hilfe von
            jemandem, der selbst schon so einen Fall gewonnen hat (CHF 560 Abo-Rückerstattung
            während einer finanziellen Notlage).
          </p>

          <div className="space-y-2 mb-4 text-xs" style={{ color: "var(--ink-3)" }}>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--rule)" }}>
              <span>Ersteinschätzung</span><span className="coords">CHF 5, einmalig</span>
            </div>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--rule)" }}>
              <span>Fall bis CHF 200 — Weiterverfolgung inklusive</span><span className="coords">3% Erfolgshonorar</span>
            </div>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--rule)" }}>
              <span>Fall bis CHF 5&apos;000 — Bearbeitung</span><span className="coords">bis CHF 65 + 9% Erfolgshonorar</span>
            </div>
            <div className="flex justify-between">
              <span>Fall über CHF 5&apos;000</span><span className="coords">noch nicht im Angebot</span>
            </div>
          </div>
          {estimate && (
            <p className="text-xs mb-4" style={{ color: "var(--ink-3)" }}>
              Bei CHF {betragNum.toFixed(0)}: {estimate.label}, ca. CHF {estimate.fee} Erfolgshonorar
              — nur fällig, wenn du das Geld tatsächlich bekommst.
            </p>
          )}
          {overLimit && (
            <p className="text-xs mb-4" style={{ color: "var(--ink-3)" }}>
              Bei Beträgen über CHF 5&apos;000 kann ich noch keine Weiterverfolgung anbieten — dafür fehlt mir
              noch die Erfahrung. Die CHF-5-Ersteinschätzung bekommst du trotzdem.
            </p>
          )}

          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full field px-4 py-2.5 text-sm mb-2"
          />
          <input
            type="email"
            placeholder="E-Mail — hier bekommst du die Antwort"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full field px-4 py-2.5 text-sm mb-4"
          />
          <button
            onClick={startCheckout}
            disabled={!email.trim() || checkoutLoading}
            className="btn btn-primary w-full py-3.5 text-sm font-semibold disabled:opacity-40"
          >
            {checkoutLoading ? "Weiterleitung…" : "Für CHF 5 prüfen lassen →"}
          </button>
          <p className="text-xs mt-3 text-center" style={{ color: "var(--ink-3)" }}>
            Einmalig · kein Abo · Antwort persönlich von mir
          </p>
        </div>
      )}

      {result && result.chance === "schwierig" && (
        <div className="card p-6 text-sm" style={{ color: "var(--ink-2)" }}>
          Ehrlich gesagt: bei diesem Fall würde ich das Geld für die Ersteinschätzung sparen.
          Wenn du trotzdem eine zweite Meinung willst, schreib mir kurz an{" "}
          <a href="mailto:ma.akd@proton.me" className="underline">ma.akd@proton.me</a>.
        </div>
      )}
    </main>
  );
}
