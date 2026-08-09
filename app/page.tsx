"use client";

import { useState, useEffect } from "react";
import GlobeNav from "./GlobeNav";

const FREE_LIMIT    = 50;
const PREMIUM_LIMIT = 3;
const FREE_KEY      = "einspruch_free";
const PREM_KEY      = "einspruch_prem";
const PURCHASED_KEY = "einspruch_purchased";
const USED_SID_KEY  = "einspruch_used_sids";

function getUses(key: string) {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(key) ?? "0", 10);
}
function incUses(key: string) {
  localStorage.setItem(key, String(getUses(key) + 1));
}

function cleanLetter(raw: string, name: string, address: string): string {
  return raw
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[NAME\]/g, name || "[Ihr Name]")
    .replace(/\[ADRESSE\]/g, address || "[Ihre Adresse]")
    .replace(/\[Ihr Name\]/gi, name || "[Ihr Name]")
    .replace(/\[Ihre Adresse\]/gi, address || "[Ihre Adresse]");
}

const RECIPIENTS = [
  { id: "kk",          label: "🏥 Krankenkasse" },
  { id: "gemeinde",    label: "🏛️ Gemeinde / Behörde" },
  { id: "vermieter",   label: "🏠 Vermieter" },
  { id: "arbeitgeber", label: "💼 Arbeitgeber" },
  { id: "ahv",         label: "📋 AHV / IV / Sozialdienst" },
  { id: "bank",        label: "🏦 Bank / Versicherung" },
  { id: "telekom",     label: "📱 Telekom / Internetanbieter" },
  { id: "busse",       label: "🚗 Ordnungsbusse" },
  { id: "kuendigung",  label: "✂️ Vertrag / Abo kündigen" },
  { id: "versicherung_sach", label: "🛡️ Sachversicherung" },
  { id: "andere",      label: "📝 Andere" },
];

const LANGUAGES = [
  { id: "de", label: "Deutsch" },
  { id: "fr", label: "Français" },
  { id: "it", label: "Italiano" },
];


export default function Home() {
  const [step, setStep]             = useState<"landing" | "form" | "result" | "paywall">("landing");
  const [recipient, setRecipient]   = useState("kk");
  const [situation, setSituation]   = useState("");
  const [goal, setGoal]             = useState("");
  const [name, setName]             = useState("");
  const [address, setAddress]       = useState("");
  const [premium, setPremium]           = useState(false);
  const [letter, setLetter]             = useState("");
  const [tier, setTier]                 = useState<"free"|"premium">("free");
  const [loading, setLoading]           = useState(false);
  const [freeUses, setFreeUses]         = useState(0);
  const [premUses, setPremUses]         = useState(0);
  const [purchasedPrem, setPurchasedPrem] = useState(0);
  const [copied, setCopied]             = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [lang, setLang]                 = useState("de");
  const [forceVerfuegung, setForceVerfuegung] = useState(false);
  const [wiz, setWiz] = useState(0);       // one question per screen

  useEffect(() => {
    setFreeUses(getUses(FREE_KEY));
    setPremUses(getUses(PREM_KEY));
    setPurchasedPrem(parseInt(localStorage.getItem(PURCHASED_KEY) || "0"));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const go = params.get("go");
    if (go && RECIPIENTS.some((r) => r.id === go)) {
      setRecipient(go);
      setStep("form");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminToken = params.get("admin");
    if (!adminToken) return;
    window.history.replaceState({}, "", "/"); // strip token from the URL/history immediately
    fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: adminToken }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.granted) {
          const current = parseInt(localStorage.getItem(PURCHASED_KEY) || "0");
          localStorage.setItem(PURCHASED_KEY, String(current + data.granted));
          setPurchasedPrem((prev) => prev + data.granted);
          setPremium(true);
          setStep("form");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success") return;
    const sid = params.get("session_id");
    window.history.replaceState({}, "", "/");
    if (!sid) return;
    const usedSids: string[] = JSON.parse(localStorage.getItem(USED_SID_KEY) || "[]");
    if (usedSids.includes(sid)) return;
    fetch("/api/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sid }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.granted) {
          const current = parseInt(localStorage.getItem(PURCHASED_KEY) || "0");
          localStorage.setItem(PURCHASED_KEY, String(current + data.granted));
          setPurchasedPrem((prev) => prev + data.granted);
          usedSids.push(sid);
          localStorage.setItem(USED_SID_KEY, JSON.stringify(usedSids));
          setPremium(true);
          setStep("form");
        }
      })
      .catch(() => {});
  }, []);

  async function startCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setCheckoutLoading(false);
    }
  }

  async function generate() {
    if (!situation.trim() || !goal.trim() || loading) return;
    if (!premium && freeUses >= FREE_LIMIT) { setStep("paywall"); return; }
    if (premium && premUses >= PREMIUM_LIMIT + purchasedPrem) { setStep("paywall"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, situation, goal, premium, lang, forceVerfuegung }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLetter(cleanLetter(data.letter, name, address));
      const actualTier = data.tier ?? "free";
      setTier(actualTier);
      if (actualTier === "premium") {
        incUses(PREM_KEY); setPremUses(getUses(PREM_KEY));
      } else {
        incUses(FREE_KEY); setFreeUses(getUses(FREE_KEY));
      }
      setStep("result");
    } catch {
      alert("Fehler. Bitte nochmals versuchen.");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const remaining     = Math.max(0, FREE_LIMIT - freeUses);
  const premRemaining = Math.max(0, PREMIUM_LIMIT + purchasedPrem - premUses);

  // ── PAYWALL ──
  if (step === "paywall") return <Paywall onBack={() => setStep("form")} />;

  // ── RESULT ──
  if (step === "result") return (
    <main className="max-w-2xl mx-auto px-5 py-12 print:p-0 print:max-w-none">
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <button onClick={() => { setStep("form"); setLetter(""); }} className="text-sm  transition-colors">← Neu</button>
        <span className="">|</span>
        {tier === "premium"
          ? <span className="text-xs kicker font-semibold px-2 py-0.5 rounded-full">✦ Premium — Claude</span>
          : <span className="text-sm ">Kostenloser Brief (Groq)</span>}
      </div>
      <div className="card p-10 shadow-sm mb-6 print:shadow-none print:border-none print:rounded-none print:p-0">
        <pre className="whitespace-pre-wrap text-[14.5px]  leading-[1.8] font-serif">{letter}</pre>
      </div>
      <div className="flex gap-3 print:hidden">
        <button onClick={copy} className="flex-1 py-3 rounded-xl font-semibold text-sm btn btn-primary transition-colors">
          {copied ? "✓ Kopiert!" : "Brief kopieren"}
        </button>
        <button onClick={() => window.print()} className="px-5 py-3 rounded-xl text-sm    transition-colors">
          Drucken / PDF
        </button>
      </div>
      <div className="mt-3 flex gap-2 print:hidden">
        <input
          type="email"
          placeholder="E-Mail des Empfängers (optional)"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          className="flex-1 field px-4 py-2.5 text-sm  placeholder:text-zinc-400 outline-none  transition-colors"
        />
        <a
          href={`mailto:${recipientEmail}?subject=${encodeURIComponent(letter.split("\n")[1] || "Einsprache")}&body=${encodeURIComponent(letter)}`}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-center transition-colors ${recipientEmail ? "btn btn-primary" : "btn pointer-events-none opacity-50"}`}
        >
          Jetzt senden →
        </a>
      </div>
      {tier === "free" && remaining === 0 && (
        <div className="mt-4 p-4 card print:hidden">
          <p className="text-sm font-medium">✦ Premium: bessere Gesetzesreferenzen mit Claude AI</p>
          <button onClick={startCheckout} disabled={checkoutLoading} className="text-xs underline">{checkoutLoading ? "Weiterleitung…" : "10 Briefe freischalten — CHF 4.90"}</button>
        </div>
      )}
      {tier === "free" && remaining > 0 && (
        <p className="text-center text-xs text-zinc-400 mt-4 print:hidden">{remaining} kostenlose Brief{remaining !== 1 ? "e" : ""} übrig</p>
      )}
      {tier === "premium" && (
        <p className="text-center text-xs text-zinc-400 mt-4 print:hidden">{premRemaining} Premium-Brief{premRemaining !== 1 ? "e" : ""} übrig</p>
      )}
    </main>
  );

  // ── FORM (one question per screen) ──
  const STEPS = ["An wen?", "Was ist passiert?", "Was willst du erreichen?", "Wer bist du?", "Fertig"];

  if (step === "form") {
    const canNext =
      wiz === 0 ? !!recipient :
      wiz === 1 ? !!situation.trim() :
      wiz === 2 ? !!goal.trim() :
      true;

    return (
      <main className="max-w-lg mx-auto px-5 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => (wiz === 0 ? setStep("landing") : setWiz(wiz - 1))}
            className="text-sm"
            style={{ color: "var(--ink-3)" }}
          >
            ← zurück
          </button>
          <span className="coords text-xs">{wiz + 1} / {STEPS.length}</span>
        </div>

        {/* progress — a horizon line filling up */}
        <div className="mb-8 h-[2px] w-full" style={{ background: "var(--rule)" }}>
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${((wiz + 1) / STEPS.length) * 100}%`, background: "var(--brass)" }}
          />
        </div>

        <h2 className="display text-3xl mb-6">{STEPS[wiz]}</h2>

        {wiz === 0 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {RECIPIENTS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setRecipient(r.id); setWiz(1); }}
                  className={`tile px-4 py-4 ${recipient === r.id ? "on" : ""}`}
                >
                  <div className="text-2xl mb-1">{r.label.split(" ")[0]}</div>
                  <div className="t text-sm">{r.label.split(" ").slice(1).join(" ")}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              {LANGUAGES.map((l) => (
                <button key={l.id} onClick={() => setLang(l.id)} className={`tile flex-1 text-center px-3 py-2 ${lang === l.id ? "on" : ""}`}>
                  <span className="t text-xs">{l.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {wiz === 1 && (
          <>
            <textarea
              autoFocus
              className="w-full field px-4 py-3 text-base resize-none min-h-[160px]"
              placeholder="Meine Krankenkasse hat meine Kostengutsprache abgelehnt…"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
            />
            <p className="text-xs mt-3" style={{ color: "var(--ink-3)" }}>Was, wann, wo — Stichworte reichen.</p>
          </>
        )}

        {wiz === 2 && (
          <>
            <textarea
              autoFocus
              className="w-full field px-4 py-3 text-base resize-none min-h-[130px]"
              placeholder="Übernahme der Behandlungskosten von CHF 800 innert 14 Tagen…"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
            {["gemeinde", "ahv", "andere"].includes(recipient) && (
              <button
                onClick={() => setForceVerfuegung(!forceVerfuegung)}
                className={`tile w-full mt-4 px-4 py-4 ${forceVerfuegung ? "on" : ""}`}
              >
                <div className="text-2xl mb-1">📜</div>
                <div className="t text-sm">Anfechtbare Verfügung erzwingen</div>
                <div className="s mt-1">Bisher nur ein mündliches oder gar kein Nein? Dann erst einen Entscheid verlangen — sonst läuft keine Frist.</div>
              </button>
            )}
            {recipient === "busse" && (
              <p className="card mt-4 px-4 py-3 text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>
                ⚠️ Verlierst du im ordentlichen Verfahren, kann die Busse höher ausfallen — plus Kosten und möglicher Registereintrag. Nur mit begründeter Bestreitung.
              </p>
            )}
          </>
        )}

        {wiz === 3 && (
          <div className="space-y-3">
            <input
              autoFocus
              className="w-full field px-4 py-3 text-base"
              placeholder="Max Muster"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full field px-4 py-3 text-base"
              placeholder="Musterstr. 1, 3000 Bern"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <p className="text-xs" style={{ color: "var(--ink-3)" }}>Bleibt auf deinem Gerät — wird nie an die KI gesendet.</p>
          </div>
        )}

        {wiz === 4 && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button onClick={() => setPremium(false)} className={`tile px-4 py-4 ${!premium ? "on" : ""}`}>
                <div className="text-2xl mb-1">○</div>
                <div className="t text-sm">Kostenlos</div>
                <div className="s">{remaining} von {FREE_LIMIT} übrig</div>
              </button>
              <button onClick={() => setPremium(true)} className={`tile px-4 py-4 ${premium ? "on" : ""}`}>
                <div className="text-2xl mb-1">✦</div>
                <div className="t text-sm">Premium</div>
                <div className="s">Präzisere Artikel · CHF 4.90</div>
              </button>
            </div>

            {premium && purchasedPrem === 0 && premRemaining === 0 && (
              <div className="card p-4 mb-5 text-center">
                <p className="text-sm mb-3" style={{ color: "var(--ink-2)" }}>Probe-Briefe aufgebraucht.</p>
                <button onClick={startCheckout} disabled={checkoutLoading} className="btn btn-primary w-full py-2.5 text-sm disabled:opacity-60">
                  {checkoutLoading ? "Weiterleitung…" : "10 Premium-Briefe — CHF 4.90"}
                </button>
              </div>
            )}

            <button
              onClick={generate}
              disabled={loading || !situation.trim() || !goal.trim()}
              className="btn btn-primary w-full py-4 text-sm font-semibold disabled:opacity-40 active:scale-[0.98]"
            >
              {loading ? "Brief wird erstellt…" : "Brief erstellen →"}
            </button>
          </>
        )}

        {wiz < 4 && (
          <button
            onClick={() => canNext && setWiz(wiz + 1)}
            disabled={!canNext}
            className="btn btn-primary w-full mt-8 py-4 text-sm font-semibold disabled:opacity-30"
          >
            Weiter →
          </button>
        )}
      </main>
    );
  }

  // ── LANDING ──
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center mb-4">
        <p className="kicker mb-4">Einspruch · Architect-DNA</p>
        <h1 className="display text-5xl leading-[1.02] mb-3">
          Du hast <em>Rechte</em>.
        </h1>
        <p className="text-base mb-2" style={{ color: "var(--ink-2)" }}>
          Dreh die Welt. Klick einen Ort.
        </p>
      </div>

      <div className="mx-auto mb-4" style={{ maxWidth: "min(78vh, 100%)" }}>
        <GlobeNav onOpenBrief={() => { setWiz(0); setStep("form"); }} />
      </div>

      <p className="text-center coords text-xs mb-10">
        Drag to turn · click opens the place
      </p>

    </main>
  );
}

function Paywall({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-5 text-center max-w-sm mx-auto">
      <div className="text-5xl mb-6">⚖️</div>
      <h2 className="text-2xl font-bold mb-3 ">Gratisbriefe aufgebraucht</h2>
      <p className=" text-sm mb-8 leading-relaxed">
        Weiter mit <strong className="">Claude AI</strong> — präzisere Gesetzesartikel, stärkere juristische Sprache.
      </p>

      <button onClick={startCheckout} disabled={loading}
        className="w-full py-4 rounded-xl font-bold text-sm btn btn-primary transition-all disabled:opacity-60 mb-3">
        {loading ? "Weiterleitung…" : "✦ 10 Premium-Briefe — CHF 4.90"}
      </button>
      <p className="text-xs text-zinc-400 mb-8">Einmalig · kein Abo · sofort verfügbar</p>

      <button onClick={onBack} className="text-xs  transition-colors">← zurück zur App</button>
    </main>
  );
}
