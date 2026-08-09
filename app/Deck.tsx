"use client";

import { useRef, useState, type ReactNode } from "react";

/* One card at a time, swiped through — the same idea as turning the globe:
 * you move to the next thing instead of reading a page of everything.
 *
 * Horizontal drag on the deck, arrow keys when focused, and dots to jump. The
 * track is translated by whole cards, so no measurement of the DOM is needed. */
export default function Deck({ cards, label }: { cards: ReactNode[]; label: string }) {
  const [i, setI] = useState(0);
  const drag = useRef<{ x: number; done: boolean } | null>(null);
  const [dx, setDx] = useState(0);

  const clamp = (n: number) => Math.max(0, Math.min(cards.length - 1, n));

  function end() {
    if (!drag.current) return;
    // A third of the width is enough to commit — a flick shouldn't need a full swipe.
    if (Math.abs(dx) > 60) setI((n) => clamp(n + (dx < 0 ? 1 : -1)));
    drag.current = null;
    setDx(0);
  }

  return (
    <div className="deck" aria-roledescription="carousel" aria-label={label}>
      <div
        className="deck-view"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); setI((n) => clamp(n + 1)); }
          if (e.key === "ArrowLeft")  { e.preventDefault(); setI((n) => clamp(n - 1)); }
        }}
        onPointerDown={(e) => { drag.current = { x: e.clientX, done: false }; }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const d = e.clientX - drag.current.x;
          // Resist dragging past either end, so the deck feels bounded.
          const past = (i === 0 && d > 0) || (i === cards.length - 1 && d < 0);
          setDx(past ? d * 0.3 : d);
        }}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
      >
        <div
          className="deck-track"
          style={{
            transform: `translateX(calc(${-i * 100}% + ${dx}px))`,
            transition: drag.current ? "none" : "transform .32s cubic-bezier(.22,.61,.36,1)",
          }}
        >
          {cards.map((c, n) => (
            <div className="deck-card" key={n} aria-hidden={n !== i}>{c}</div>
          ))}
        </div>
      </div>

      <div className="deck-dots">
        {cards.map((_, n) => (
          <button
            key={n}
            className={`deck-dot${n === i ? " on" : ""}`}
            aria-label={`${n + 1} von ${cards.length}`}
            aria-current={n === i}
            onClick={() => setI(n)}
          />
        ))}
      </div>
    </div>
  );
}
