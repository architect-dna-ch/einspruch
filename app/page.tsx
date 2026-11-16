"use client";

import { useState, useEffect } from "react";
import { useLang, LangSwitch } from "@/app/lib/lang";

const FREE_LIMIT    = 50;
const PREMIUM_LIMIT = 3;
const FREE_KEY      = "einspruch_free";
const PREM_KEY      = "einspruch_prem";
const PURCHASED_KEY = "einspruch_purchased";
const USED_SID_KEY  = "einspruch_used_sids";
const TOKEN_KEY     = "einspruch_token";   // the purchase id; credits are counted on the server
const ADMIN_KEY     = "einspruch_admin";

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
  { id: "kk", icon: "🏥", de: "Krankenkasse", en: "Health insurer" },
  { id: "gemeinde", icon: "🏛️", de: "Gemeinde / Behörde", en: "Municipality / authority" },
  { id: "vermieter", icon: "🏠", de: "Vermieter", en: "Landlord" },
  { id: "arbeitgeber", icon: "💼", de: "Arbeitgeber", en: "Employer" },
  { id: "ahv", icon: "📋", de: "AHV / IV / Sozialdienst", en: "AHV / IV / social services" },
  { id: "bank", icon: "🏦", de: "Bank / Versicherung", en: "Bank / insurance" },
  { id: "telekom", icon: "📱", de: "Telekom / Internetanbieter", en: "Telecom / internet" },
  { id: "busse", icon: "🚗", de: "Ordnungsbusse", en: "Fine (parking / traffic)" },
  { id: "kuendigung", icon: "✂️", de: "Vertrag / Abo kündigen", en: "Cancel a contract" },
  { id: "versicherung_sach", icon: "🛡️", de: "Sachversicherung", en: "Property insurance" },
  { id: "andere", icon: "📝", de: "Andere", en: "Other" },
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
  const [tone, setTone] = useState<"" | "friendly" | "firm" | "formal">("");
  const [ownWish, setOwnWish] = useState("");
  // Landlord, employer & co.: start friendly; insurers and offices: the formal objection.
  const effTone = tone || (["vermieter", "arbeitgeber", "telekom", "bank", "kuendigung"].includes(recipient) ? "friendly" : "formal");
  const [wiz, setWiz] = useState(0);       // one question per screen
  const { de, t, toggle } = useLang();

  // Earlier purchases were only remembered as used ids; carry the latest over as the server-side token.
  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) return;
    const old: string[] = JSON.parse(localStorage.getItem(USED_SID_KEY) || "[]");
    if (old.length) localStorage.setItem(TOKEN_KEY, old[old.length - 1]);
  }, []);

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
          localStorage.setItem(ADMIN_KEY, adminToken);
          localStorage.setItem(PURCHASED_KEY, String(data.granted));
          setPurchasedPrem(data.granted);
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
          if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(PURCHASED_KEY, String(data.granted));
          localStorage.setItem(PREM_KEY, "0");
          setPremUses(0);
          setPurchasedPrem(data.granted);
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
        body: JSON.stringify({ recipient, situation, goal, premium, lang, forceVerfuegung, tone: effTone,
          token: localStorage.getItem(TOKEN_KEY) || undefined, admin: localStorage.getItem(ADMIN_KEY) || undefined }),
      });
      if (res.status === 402) { setStep("paywall"); return; }
      if (res.status === 429) { alert(t("Short break — too many requests. Please try again in a few minutes.", "Kurz Pause — zu viele Anfragen. Bitte in ein paar Minuten nochmals.")); return; }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (typeof data.remaining === "number" && data.remaining >= 0) {
        localStorage.setItem(PURCHASED_KEY, String(data.remaining));
        localStorage.setItem(PREM_KEY, "0");
        setPurchasedPrem(data.remaining);
        setPremUses(0);
      }
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
      alert(t("Error. Please try again.", "Fehler. Bitte nochmals versuchen."));
    } finally {
      setLoading(false);
    }
  }

  /** Rework the finished letter: only what you ask for changes. */
  async function revise(instruction: string) {
    if (!instruction.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, lang, premium, revise: { letter, instruction },
          token: localStorage.getItem(TOKEN_KEY) || undefined, admin: localStorage.getItem(ADMIN_KEY) || undefined }),
      });
      if (res.status === 402) { setStep("paywall"); return; }
      const data = await res.json();
      if (data.letter) { setLetter(cleanLetter(data.letter, name, address)); setOwnWish(""); }
      else alert(t("Couldn't rework it. Try again.", "Hat nicht geklappt. Nochmal versuchen."));
    } catch {
      alert(t("Couldn't rework it. Try again.", "Hat nicht geklappt. Nochmal versuchen."));
    } finally {
      setLoading(false);
    }
  }

  const REVISIONS: [string, string][] = [
    [t("✂️ Shorter", "✂️ Kürzer"), t("Make it clearly shorter, about half. Keep only what matters.", "Deutlich kürzer, etwa die Hälfte. Nur das Wichtigste behalten.")],
    [t("🤝 Friendlier", "🤝 Freundlicher"), t("Make it friendly and cooperative: no legal threats, no deadline with consequences, offer solutions.", "Freundlich und kooperativ: keine rechtlichen Drohungen, keine Frist mit Konsequenzen, Lösungen anbieten.")],
    [t("📌 Firmer", "📌 Bestimmter"), t("Make it firmer: a clear request with a 14-day deadline, still polite.", "Bestimmter: klare Forderung mit 14 Tagen Frist, trotzdem höflich.")],
    [t("🚫 No legal articles", "🚫 Ohne Gesetze"), t("Remove all legal articles and legal language; plain, clear words.", "Alle Gesetzesartikel und Juristensprache entfernen; einfache, klare Worte.")],
    [t("✉️ As an email", "✉️ Als E-Mail"), t("Turn it into a short email: no date line, no address block, subject line on top.", "Als kurze E-Mail: ohne Datumszeile, ohne Adressblock, Betreff oben.")],
  ];

  function copy() {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const remaining     = Math.max(0, FREE_LIMIT - freeUses);
  const premRemaining = Math.max(0, PREMIUM_LIMIT + purchasedPrem - premUses);

  // ── PAYWALL ──
  if (step === "paywall") return <><LangSwitch de={de} toggle={toggle} /><Paywall onBack={() => setStep("form")} t={t} /></>;

  // ── RESULT ──
  if (step === "result") return (
    <main className="max-w-2xl mx-auto px-5 py-12 print:p-0 print:max-w-none">
      <div className="print:hidden"><LangSwitch de={de} toggle={toggle} /></div>
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <button onClick={() => { setStep("form"); setLetter(""); }} className="text-sm  transition-colors">{t("← New", "← Neu")}</button>
        <span className="">|</span>
        {tier === "premium"
          ? <span className="text-xs kicker font-semibold px-2 py-0.5 rounded-full">✦ Premium — Claude</span>
          : <span className="text-sm ">{t("Free letter (Groq)", "Kostenloser Brief (Groq)")}</span>}
      </div>
      <div className="card p-10 shadow-sm mb-6 print:shadow-none print:border-none print:rounded-none print:p-0">
        <pre className="whitespace-pre-wrap text-[14.5px]  leading-[1.8] font-serif">{letter}</pre>
      </div>
      <div className="flex gap-3 print:hidden">
        <button onClick={copy} className="flex-1 py-3 rounded-xl font-semibold text-sm btn btn-primary transition-colors">
          {copied ? t("✓ Copied!", "✓ Kopiert!") : t("Copy letter", "Brief kopieren")}
        </button>
        <button onClick={() => window.print()} className="px-5 py-3 rounded-xl text-sm    transition-colors">
          {t("Print / PDF", "Drucken / PDF")}
        </button>
      </div>
      <div className="mt-3 flex gap-2 print:hidden">
        <input
          type="email"
          placeholder={t("Recipient's email (optional)", "E-Mail des Empfängers (optional)")}
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          className="flex-1 field px-4 py-2.5 text-sm  placeholder:text-zinc-400 outline-none  transition-colors"
        />
        <a
          href={`mailto:${recipientEmail}?subject=${encodeURIComponent(letter.split("\n")[1] || "Einsprache")}&body=${encodeURIComponent(letter)}`}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-center transition-colors ${recipientEmail ? "btn btn-primary" : "btn pointer-events-none opacity-50"}`}
        >
          {t("Send now →", "Jetzt senden →")}
        </a>
      </div>
      <div className="mt-6 print:hidden">
        <p className="kicker mb-2">{t("Rework", "Überarbeiten")}</p>
        <div className="flex flex-wrap gap-2">
          {REVISIONS.map(([label, ins]) => (
            <button key={label} onClick={() => revise(ins)} disabled={loading} className="tile px-3 py-2 text-sm disabled:opacity-50">{label}</button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={ownWish}
            onChange={(e) => setOwnWish(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") revise(ownWish); }}
            placeholder={t("Own change, e.g. leave out the late payments", "Eigene Änderung, z.B. Zahlungsverzug weglassen")}
            className="flex-1 field px-4 py-2.5 text-sm outline-none"
          />
          <button onClick={() => revise(ownWish)} disabled={loading || !ownWish.trim()} className="btn btn-primary px-4 text-sm disabled:opacity-40">
            {loading ? "…" : "→"}
          </button>
        </div>
      </div>
      {tier === "free" && remaining === 0 && (
        <div className="mt-4 p-4 card print:hidden">
          <p className="text-sm font-medium">{t("✦ Premium: better legal references with Claude AI", "✦ Premium: bessere Gesetzesreferenzen mit Claude AI")}</p>
          <button onClick={startCheckout} disabled={checkoutLoading} className="text-xs underline">{checkoutLoading ? t("Redirecting…", "Weiterleitung…") : t("Unlock 10 letters — CHF 4.90", "10 Briefe freischalten — CHF 4.90")}</button>
        </div>
      )}
      {tier === "free" && remaining > 0 && (
        <p className="text-center text-xs text-zinc-400 mt-4 print:hidden">{de ? `${remaining} kostenlose Brief${remaining !== 1 ? "e" : ""} übrig` : `${remaining} free letter${remaining !== 1 ? "s" : ""} left`}</p>
      )}
      {tier === "premium" && (
        <p className="text-center text-xs text-zinc-400 mt-4 print:hidden">{de ? `${premRemaining} Premium-Brief${premRemaining !== 1 ? "e" : ""} übrig` : `${premRemaining} Premium letter${premRemaining !== 1 ? "s" : ""} left`}</p>
      )}
    </main>
  );

  // ── FORM (one question per screen) ──
  const STEPS = [t("Who to?", "An wen?"), t("What happened?", "Was ist passiert?"), t("What do you want to achieve?", "Was willst du erreichen?"), t("Who are you?", "Wer bist du?"), t("Done", "Fertig")];

  if (step === "form") {
    const canNext =
      wiz === 0 ? !!recipient :
      wiz === 1 ? !!situation.trim() :
      wiz === 2 ? !!goal.trim() :
      true;

    return (
      <main className="max-w-lg mx-auto px-5 py-12">
        <LangSwitch de={de} toggle={toggle} />
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => (wiz === 0 ? setStep("landing") : setWiz(wiz - 1))}
            className="text-sm"
            style={{ color: "var(--ink-3)" }}
          >
            {t("← back", "← zurück")}
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
                  <div className="text-2xl mb-1">{r.icon}</div>
                  <div className="t text-sm">{de ? r.de : r.en}</div>
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
              placeholder={t("My health insurer refused to cover my treatment…", "Meine Krankenkasse hat meine Kostengutsprache abgelehnt…")}
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
            />
            <p className="text-xs mt-3" style={{ color: "var(--ink-3)" }}>{t("What, when, where — keywords are enough.", "Was, wann, wo — Stichworte reichen.")}</p>
          </>
        )}

        {wiz === 2 && (
          <>
            <textarea
              autoFocus
              className="w-full field px-4 py-3 text-base resize-none min-h-[130px]"
              placeholder={t("Cover the treatment costs of CHF 800 within 14 days…", "Übernahme der Behandlungskosten von CHF 800 innert 14 Tagen…")}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
            <p className="kicker mt-6 mb-2">{t("Tone", "Ton")}</p>
            <div className="grid grid-cols-3 gap-2">
              {([["friendly", "🤝", t("Friendly request", "Freundliche Anfrage")], ["firm", "📌", t("Firm, deadline", "Bestimmt, mit Frist")], ["formal", "⚖️", t("Formal objection", "Formelle Einsprache")]] as const).map(([id, ic, label]) => (
                <button key={id} onClick={() => setTone(id)} className={`tile px-3 py-3 ${effTone === id ? "on" : ""}`}>
                  <div className="text-xl mb-1">{ic}</div>
                  <div className="t text-xs">{label}</div>
                </button>
              ))}
            </div>
            {["gemeinde", "ahv", "andere"].includes(recipient) && (
              <button
                onClick={() => setForceVerfuegung(!forceVerfuegung)}
                className={`tile w-full mt-4 px-4 py-4 ${forceVerfuegung ? "on" : ""}`}
              >
                <div className="text-2xl mb-1">📜</div>
                <div className="t text-sm">{t("Force a formal, appealable decision", "Anfechtbare Verfügung erzwingen")}</div>
                <div className="s mt-1">{t("Only a verbal no, or no answer at all? Then demand a decision first — otherwise no deadline runs.", "Bisher nur ein mündliches oder gar kein Nein? Dann erst einen Entscheid verlangen — sonst läuft keine Frist.")}</div>
              </button>
            )}
            {recipient === "busse" && (
              <p className="card mt-4 px-4 py-3 text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>
                {t("⚠️ If you lose in the regular procedure, the fine can be higher — plus costs and a possible record entry. Only with a well-founded objection.", "⚠️ Verlierst du im ordentlichen Verfahren, kann die Busse höher ausfallen — plus Kosten und möglicher Registereintrag. Nur mit begründeter Bestreitung.")}
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
              placeholder={t("Sample St. 1, 3000 Bern", "Musterstr. 1, 3000 Bern")}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <p className="text-xs" style={{ color: "var(--ink-3)" }}>{t("Stays on your device — never sent to the AI.", "Bleibt auf deinem Gerät — wird nie an die KI gesendet.")}</p>
          </div>
        )}

        {wiz === 4 && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button onClick={() => setPremium(false)} className={`tile px-4 py-4 ${!premium ? "on" : ""}`}>
                <div className="text-2xl mb-1">○</div>
                <div className="t text-sm">{t("Free", "Kostenlos")}</div>
                <div className="s">{t(`${remaining} of ${FREE_LIMIT} left`, `${remaining} von ${FREE_LIMIT} übrig`)}</div>
              </button>
              <button onClick={() => setPremium(true)} className={`tile px-4 py-4 ${premium ? "on" : ""}`}>
                <div className="text-2xl mb-1">✦</div>
                <div className="t text-sm">Premium</div>
                <div className="s">{t("More precise articles · CHF 4.90", "Präzisere Artikel · CHF 4.90")}</div>
              </button>
            </div>

            {premium && purchasedPrem === 0 && premRemaining === 0 && (
              <div className="card p-4 mb-5 text-center">
                <p className="text-sm mb-3" style={{ color: "var(--ink-2)" }}>{t("Trial letters used up.", "Probe-Briefe aufgebraucht.")}</p>
                <button onClick={startCheckout} disabled={checkoutLoading} className="btn btn-primary w-full py-2.5 text-sm disabled:opacity-60">
                  {checkoutLoading ? t("Redirecting…", "Weiterleitung…") : t("10 Premium letters — CHF 4.90", "10 Premium-Briefe — CHF 4.90")}
                </button>
              </div>
            )}

            <button
              onClick={generate}
              disabled={loading || !situation.trim() || !goal.trim()}
              className="btn btn-primary w-full py-4 text-sm font-semibold disabled:opacity-40 active:scale-[0.98]"
            >
              {loading ? t("Writing letter…", "Brief wird erstellt…") : t("Write letter →", "Brief erstellen →")}
            </button>
          </>
        )}

        {wiz < 4 && (
          <button
            onClick={() => canNext && setWiz(wiz + 1)}
            disabled={!canNext}
            className="btn btn-primary w-full mt-8 py-4 text-sm font-semibold disabled:opacity-30"
          >
            {t("Next →", "Weiter →")}
          </button>
        )}
      </main>
    );
  }

  // ── LANDING ──
  const TOOLS = [
    { icon: "✉️", label: t("Write a letter", "Brief erstellen"), sub: t("Objection in 60 seconds", "Einsprache in 60 Sekunden"), action: () => { setWiz(0); setStep("form"); } },
    { icon: "⏱️", label: t("Deadline calculator", "Frist berechnen"), sub: t("how long do I have?", "wie lange habe ich noch?"), href: "/fristenrechner" },
    { icon: "🧭", label: t("Signpost", "Wegweiser"), sub: t("who is responsible?", "wer ist zuständig?"), href: "/wegweiser" },
    { icon: "📁", label: t("Evidence folder", "Belegmappe"), sub: t("collect proof", "Beweise sammeln"), href: "/belegmappe" },
  ];

  return (
    <main className="max-w-2xl mx-auto px-5 py-14">
      <LangSwitch de={de} toggle={toggle} />
      <div className="mb-10">
        <p className="kicker mb-4">Einspruch · Architect-DNA</p>
        <h1 className="display text-4xl md:text-5xl leading-[1.05] mb-4">
          {de ? <>Du hast <em>Rechte</em>.</> : <>You have <em>rights</em>.</>}
        </h1>
        <p className="text-sm max-w-md" style={{ color: "var(--ink-2)" }}>
          {t("Health insurer, landlord, authority — a formal letter under Swiss law with the right legal articles, ready in 60 seconds. Free, no account needed.", "Krankenkasse, Vermieter, Behörde — ein formeller Brief mit den richtigen Gesetzesartikeln, fertig in 60 Sekunden. Kostenlos, kein Konto nötig.")}
        </p>
        <button
          onClick={() => { setWiz(0); setStep("form"); }}
          className="btn btn-primary px-7 py-4 text-base mt-7 inline-block"
        >
          {t("Write your letter →", "Brief jetzt schreiben →")}
        </button>
      </div>

      {/* how it works — three steps, so nobody has to guess */}
      <ol className="grid grid-cols-3 gap-3 mb-10">
        {[
          ["1", t("Choose", "Wähle"), t("insurer, landlord, authority …", "Krankenkasse, Vermieter, Behörde …")],
          ["2", t("Tell", "Erzähl"), t("what happened — keywords are enough", "was passiert ist — Stichworte reichen")],
          ["3", t("Send", "Schick"), t("copy, print or email the letter", "Brief kopieren, drucken oder mailen")],
        ].map(([n, t, d]) => (
          <li key={n} className="card px-3 py-4">
            <div className="coords text-xs mb-2">{n}</div>
            <div className="text-sm font-semibold mb-1">{t}</div>
            <div className="text-xs leading-snug" style={{ color: "var(--ink-2)", overflowWrap: "anywhere" }}>{d}</div>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-2 gap-3 mb-10">
        {TOOLS.map((t) => (
          <a
            key={t.label}
            href={t.href ?? "#"}
            onClick={t.action ? (e) => { e.preventDefault(); t.action!(); } : undefined}
            className="tile px-5 py-5"
          >
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="t text-sm mb-1">{t.label}</div>
            <div className="s">{t.sub}</div>
          </a>
        ))}
      </div>

      <div className="card p-6 text-center">
        <p className="kicker mb-2">{t("Also", "Zusätzlich")}</p>
        <h2 className="display text-xl mb-2">{t("Is it even worth fighting?", "Lohnt sich das Kämpfen überhaupt?")}</h2>
        <p className="text-sm mb-4" style={{ color: "var(--ink-2)" }}>
          {t("A free first assessment of your chances before you invest time.", "Kostenlose Ersteinschätzung deiner Chancen, bevor du Zeit investierst.")}
        </p>
        <a href="/fallpruefung" className="btn btn-primary px-6 py-3 text-sm inline-block">{t("Assess my case for free →", "Fall kostenlos einschätzen →")}</a>
      </div>

      <p className="text-xs text-center mt-8 leading-relaxed" style={{ color: "var(--ink-3)" }}>
        {t("Letters free (Groq). Premium with Claude: 3 free, then 10 for CHF 4.90 — one time, no subscription.", "Briefe kostenlos (Groq). Premium mit Claude: 3 gratis, dann 10 für CHF 4.90 — einmalig, kein Abo.")}
        <br />{t("Your details are only sent to write the letter and are not stored.", "Deine Angaben werden nur zum Schreiben des Briefs übermittelt und nicht gespeichert.")}
        <br />{t("Not legal advice — a drafting aid for your own letter. Letters are written in German, French or Italian for Swiss offices.", "Keine Rechtsberatung — eine Formulierungshilfe für deinen eigenen Brief.")}
      </p>
    </main>
  );
}

function Paywall({ onBack, t }: { onBack: () => void; t: (en: string, de: string) => string }) {
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
      <h2 className="text-2xl font-bold mb-3 ">{t("Free letters used up", "Gratisbriefe aufgebraucht")}</h2>
      <p className=" text-sm mb-8 leading-relaxed">
        {t("Continue with Claude AI — more precise legal articles, stronger legal language.", "Weiter mit Claude AI — präzisere Gesetzesartikel, stärkere juristische Sprache.")}
      </p>

      <button onClick={startCheckout} disabled={loading}
        className="w-full py-4 rounded-xl font-bold text-sm btn btn-primary transition-all disabled:opacity-60 mb-3">
        {loading ? t("Redirecting…", "Weiterleitung…") : t("✦ 10 Premium letters — CHF 4.90", "✦ 10 Premium-Briefe — CHF 4.90")}
      </button>
      <p className="text-xs text-zinc-400 mb-8">{t("One time · no subscription · available at once", "Einmalig · kein Abo · sofort verfügbar")}</p>

      <button onClick={onBack} className="text-xs  transition-colors">{t("← back to the app", "← zurück zur App")}</button>
    </main>
  );
}
