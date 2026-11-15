"use client";

import { useEffect, useSyncExternalStore } from "react";

const EVENT = "site-lang";
const subscribe = (cb: () => void) => { window.addEventListener(EVENT, cb); return () => window.removeEventListener(EVENT, cb); };
const read = () => {
  const saved = localStorage.getItem("site_lang");
  return saved ? saved === "de" : (navigator.language || "en").toLowerCase().startsWith("de");
};

/** English by default; German when the browser is German (or the visitor picked it). */
export function useLang() {
  const de = useSyncExternalStore(subscribe, read, () => false);
  useEffect(() => { document.documentElement.lang = de ? "de" : "en"; }, [de]);
  const t = (en: string, deText: string) => (de ? deText : en);
  const toggle = () => { localStorage.setItem("site_lang", de ? "en" : "de"); window.dispatchEvent(new Event(EVENT)); };
  return { de, t, toggle };
}

/** Small DE/EN switch, top right. */
export function LangSwitch({ de, toggle }: { de: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      aria-label="Language / Sprache"
      style={{ position: "fixed", top: 14, right: 14, zIndex: 50, font: "inherit", fontSize: 12, padding: "4px 10px",
        borderRadius: 20, border: "1px solid var(--rule, #ccc)", background: "var(--paper, transparent)", color: "var(--ink-2, inherit)", cursor: "pointer" }}
    >
      {de ? "EN" : "DE"}
    </button>
  );
}
