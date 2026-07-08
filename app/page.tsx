"use client";

import { useState, useEffect } from "react";

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
  { id: "andere",      label: "📝 Andere" },
];

const EXAMPLE_FREE = `27. Mai 2026
Einsprache gegen Leistungsablehnung

Sehr geehrte Damen und Herren,

Am 15. Mai 2026 suchte ich das Citynotfall Zürich aufgrund eines medizinischen Notfalls auf. Die Kosten sollten gemäss Auskunft der Mitarbeitenden über die obligatorische Grundversicherung abgerechnet werden. Nun habe ich eine Rechnung erhalten, die nicht korrekt über meine Krankenkasse abgerechnet wurde.

Gemäss KVG Art. 25 hat die obligatorische Krankenpflegeversicherung die Kosten für medizinisch notwendige ambulante Behandlungen zu übernehmen. Da ich nicht unfallversichert bin, ist die Grundversicherung als alleiniger Kostenträger zuständig. Die vorliegende Rechnung widerspricht diesen Vorgaben.

Ich fordere Sie auf, die Rechnung korrekt über meine Grundversicherung abzurechnen innert 14 Tagen. Andernfalls werde ich eine Beschwerde einreichen.

Freundliche Grüsse,
[Ihr Name]
[Ihre Adresse]`;

const EXAMPLE_PREMIUM = `27. Mai 2026
Einsprache gegen fehlerhafte Rechnungsstellung — Citynotfall Zürich, 15. Mai 2026

Sehr geehrte Damen und Herren,

Am 15. Mai 2026 suchte ich das Citynotfall Zürich aufgrund eines akuten medizinischen Notfalls auf. Die anwesenden Mitarbeitenden bestätigten ausdrücklich, dass die Behandlungskosten über die obligatorische Grundversicherung abgerechnet werden. Die mir nun vorliegende Rechnung weicht von dieser Zusicherung ab und entspricht nicht den gesetzlich vorgesehenen Tarifen.

Gemäss KVG Art. 25 Abs. 1 übernimmt die obligatorische Krankenpflegeversicherung die Kosten für Leistungen, die der Diagnose oder Behandlung einer Krankheit dienen. Da ich zum Zeitpunkt der Behandlung nicht unfallversichert war, greift gemäss KVG Art. 1a Abs. 2 lit. b ausschliesslich die Grundversicherung als Kostenträgerin. KVV Art. 49 schreibt vor, dass ambulante Spitalleistungen nach den kantonal genehmigten Tarifen abzurechnen sind. Die vorliegende Rechnung verstösst gegen diese Bestimmungen.

Ich fordere Sie auf, die Rechnung vom 15. Mai 2026 auf Basis der geltenden KVG-Tarife neu auszustellen und die vollständige Kostenübernahme innert 14 Tagen schriftlich zu bestätigen. Sollten Sie dieser Aufforderung nicht fristgerecht nachkommen, behalte ich mir vor, gemäss ATSG Art. 52 formell Einsprache zu erheben und die kantonale Aufsichtsbehörde für Krankenversicherungen einzuschalten.

Freundliche Grüsse,
[Ihr Name]
[Ihre Adresse]`;

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

  useEffect(() => {
    setFreeUses(getUses(FREE_KEY));
    setPremUses(getUses(PREM_KEY));
    setPurchasedPrem(parseInt(localStorage.getItem(PURCHASED_KEY) || "0"));
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
        body: JSON.stringify({ recipient, situation, goal, premium }),
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
        <button onClick={() => { setStep("form"); setLetter(""); }} className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">← Neu</button>
        <span className="text-zinc-300">|</span>
        {tier === "premium"
          ? <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">✦ Premium — Claude</span>
          : <span className="text-sm text-zinc-500">Kostenloser Brief (Groq)</span>}
      </div>
      <div className="bg-white border border-zinc-200 rounded-2xl p-10 shadow-sm mb-6 print:shadow-none print:border-none print:rounded-none print:p-0">
        <pre className="whitespace-pre-wrap text-[14.5px] text-zinc-800 leading-[1.8] font-serif">{letter}</pre>
      </div>
      <div className="flex gap-3 print:hidden">
        <button onClick={copy} className="flex-1 py-3 rounded-xl font-semibold text-sm bg-zinc-900 hover:bg-zinc-700 text-white transition-colors">
          {copied ? "✓ Kopiert!" : "Brief kopieren"}
        </button>
        <button onClick={() => window.print()} className="px-5 py-3 rounded-xl text-sm border border-zinc-200 hover:border-zinc-400 text-zinc-600 transition-colors">
          Drucken / PDF
        </button>
      </div>
      {tier === "free" && remaining === 0 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl print:hidden">
          <p className="text-sm text-amber-800 font-medium">✦ Premium: bessere Gesetzesreferenzen mit Claude AI</p>
          <button onClick={startCheckout} disabled={checkoutLoading} className="text-xs text-amber-700 underline">{checkoutLoading ? "Weiterleitung…" : "10 Briefe freischalten — CHF 4.90"}</button>
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

  // ── FORM ──
  if (step === "form") return (
    <main className="max-w-lg mx-auto px-5 py-12">
      <button onClick={() => setStep("landing")} className="text-sm text-zinc-400 hover:text-zinc-600 mb-8 block">← zurück</button>

      <div className="mb-6">
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">An wen?</label>
        <div className="grid grid-cols-2 gap-2">
          {RECIPIENTS.map((r) => (
            <button key={r.id} onClick={() => setRecipient(r.id)}
              className={`text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                recipient === r.id ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Was ist passiert?</label>
        <textarea className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 resize-none outline-none focus:border-zinc-500 transition-colors min-h-[110px]"
          placeholder="Meine Krankenkasse hat meine Kostengutsprache abgelehnt..."
          value={situation} onChange={(e) => setSituation(e.target.value)} />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Was willst du erreichen?</label>
        <textarea className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 resize-none outline-none focus:border-zinc-500 transition-colors min-h-[80px]"
          placeholder="Übernahme der Behandlungskosten von CHF 800 innert 14 Tagen..."
          value={goal} onChange={(e) => setGoal(e.target.value)} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Dein Name</label>
          <input className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500 transition-colors"
            placeholder="Max Muster" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Adresse</label>
          <input className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500 transition-colors"
            placeholder="Musterstr. 1, 3000 Bern" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </div>

      {/* Tier selector */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <button onClick={() => setPremium(false)}
          className={`p-4 rounded-xl border text-left transition-all ${!premium ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"}`}>
          <div className="text-sm font-semibold mb-1">Kostenlos</div>
          <div className={`text-xs ${!premium ? "text-zinc-400" : "text-zinc-400"}`}>Groq · Llama 70b<br/>{remaining} von {FREE_LIMIT} übrig</div>
        </button>
        <button onClick={() => setPremium(true)}
          className={`p-4 rounded-xl border text-left transition-all ${premium ? "bg-amber-500 text-white border-amber-500" : "bg-white border-zinc-200 text-zinc-700 hover:border-amber-300"}`}>
          <div className="text-sm font-semibold mb-1">✦ Premium</div>
          <div className={`text-xs ${premium ? "text-amber-100" : "text-zinc-400"}`}>Claude AI · CHF 4.90 / 10 Briefe<br/>{premRemaining} Brief{premRemaining !== 1 ? "e" : ""} übrig</div>
        </button>
      </div>

      {premium && purchasedPrem === 0 && premRemaining === 0 && (
        <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
          <p className="text-sm text-amber-800 mb-3">Probe-Briefe aufgebraucht — jetzt freischalten.</p>
          <button onClick={startCheckout} disabled={checkoutLoading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-all disabled:opacity-60">
            {checkoutLoading ? "Weiterleitung…" : "10 Premium-Briefe — CHF 4.90"}
          </button>
        </div>
      )}

      <button onClick={generate} disabled={loading || !situation.trim() || !goal.trim()}
        className={`w-full py-4 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] text-white ${
          premium ? "bg-amber-500 hover:bg-amber-400" : "bg-zinc-900 hover:bg-zinc-700"
        }`}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            Brief wird erstellt…
          </span>
        ) : premium ? "✦ Premium Brief erstellen →" : "Brief erstellen →"}
      </button>

      <p className="text-center text-xs text-zinc-300 mt-8">Name & Adresse werden nur lokal verwendet — nie an KI gesendet</p>
    </main>
  );

  // ── LANDING ──
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-3 py-1 mb-6">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span className="text-xs font-semibold text-red-600 tracking-wide uppercase">Einspruch</span>
        </div>
        <h1 className="text-6xl font-bold leading-tight text-zinc-900 mb-5">
          Offizieller Brief.<br />In 60 Sekunden.
        </h1>
        <p className="text-lg text-zinc-500 max-w-lg mx-auto mb-8 leading-relaxed">
          Krankenkasse, Vermieter, Gemeinde — beschreibe dein Problem, erhalte einen formellen Brief mit korrekten Gesetzesartikeln.
        </p>
        <button onClick={() => setStep("form")}
          className="px-10 py-4 rounded-xl font-semibold bg-zinc-900 hover:bg-zinc-700 text-white transition-all active:scale-[0.98] text-base">
          Jetzt Brief erstellen →
        </button>
        <p className="text-xs text-zinc-400 mt-3">50 Briefe kostenlos · Kein Konto nötig</p>
      </div>

      {/* Example comparison */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Gleiche Situation — zwei Modelle</h2>
        <p className="text-xs text-zinc-400 mb-5">Beide erhalten exakt dieselbe Aufgabe. Der Unterschied liegt in der juristischen Präzision.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Free */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Kostenlos</span>
              <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">Groq · Llama 70b</span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <pre className="whitespace-pre-wrap text-[13.5px] text-zinc-500 leading-[1.8] font-serif">{EXAMPLE_FREE}</pre>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-zinc-400">
              <li>· Korrekte Grundstruktur</li>
              <li>· KVG Art. 25 erwähnt</li>
              <li>· Forderung vorhanden</li>
            </ul>
          </div>
          {/* Premium */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">✦ Premium</span>
              <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Claude AI (Anthropic)</span>
            </div>
            <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm ring-1 ring-amber-100">
              <pre className="whitespace-pre-wrap text-[13.5px] text-zinc-600 leading-[1.8] font-serif">{EXAMPLE_PREMIUM}</pre>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-zinc-500">
              <li>· KVG Art. 25 <strong>Abs. 1</strong> + Art. 1a <strong>Abs. 2 lit. b</strong></li>
              <li>· KVV Art. 49 mit kantonalem Bezug</li>
              <li>· ATSG Art. 52 + Aufsichtsbehörde als Druckmittel</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-zinc-400 mt-5 text-center">
          Beide Briefe funktionieren. Premium-Briefe zitieren Absätze und Litera — das macht den Unterschied vor Gericht.
        </p>
      </div>

      {/* Tiers */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <div className="text-lg font-bold mb-1">Kostenlos</div>
          <div className="text-xs text-zinc-400 mb-4">Groq · Llama 3.3 70b</div>
          <ul className="text-sm text-zinc-600 space-y-2 mb-6">
            <li>✓ 50 Briefe gratis</li>
            <li>✓ Schweizer Gesetzesartikel</li>
            <li>✓ Alle Behördentypen</li>
            <li>✓ Kein Konto nötig</li>
          </ul>
          <div className="text-2xl font-bold">CHF 0</div>
        </div>
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">Empfohlen</div>
          <div className="text-lg font-bold mb-1">✦ Premium</div>
          <div className="text-xs text-amber-600 mb-4">Claude AI · Präzisere Artikel</div>
          <ul className="text-sm text-zinc-700 space-y-2 mb-6">
            <li>✓ 10 Briefe pro Kauf</li>
            <li>✓ Absätze & Litera zitiert</li>
            <li>✓ Stärkere juristische Sprache</li>
            <li>✓ Kein Konto, keine Anmeldung nötig</li>
          </ul>
          <div className="text-2xl font-bold">CHF 4.90<span className="text-sm font-normal text-zinc-500"> / 10 Briefe</span></div>
        </div>
      </div>

      <div className="text-center mb-12">
        <button onClick={() => setStep("form")}
          className="px-10 py-4 rounded-xl font-semibold bg-zinc-900 hover:bg-zinc-700 text-white transition-all text-base mb-3 block mx-auto">
          Jetzt Brief erstellen →
        </button>
        <button onClick={startCheckout} disabled={checkoutLoading}
          className="inline-block text-sm text-amber-600 hover:underline font-medium">
          {checkoutLoading ? "Weiterleitung…" : "✦ Premium freischalten — CHF 4.90 →"}
        </button>
        <p className="text-xs text-zinc-300 mt-6">DSGVO-konform · Name & Adresse bleiben auf deinem Gerät · Kein Konto nötig</p>
      </div>
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
      <h2 className="text-2xl font-bold mb-3 text-zinc-900">Gratisbriefe aufgebraucht</h2>
      <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
        Weiter mit <strong className="text-zinc-800">Claude AI</strong> — präzisere Gesetzesartikel, stärkere juristische Sprache.
      </p>

      <button onClick={startCheckout} disabled={loading}
        className="w-full py-4 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 transition-all text-white disabled:opacity-60 mb-3">
        {loading ? "Weiterleitung…" : "✦ 10 Premium-Briefe — CHF 4.90"}
      </button>
      <p className="text-xs text-zinc-400 mb-8">Einmalig · kein Abo · sofort verfügbar</p>

      <button onClick={onBack} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">← zurück zur App</button>
    </main>
  );
}
