"use client";

import { useEffect, useRef, useState } from "react";

/* Navigation as a world you turn, not a menu you read.
 *
 * Ported from globus/app.html so both products behave identically: the same 3×3
 * rotation, the same perspective projection, and — the part that makes a sphere
 * read as glass rather than a lit shell — everything on the far side stays drawn,
 * dashed and faint, instead of being clipped away. */

type Place = { id: string; icon: string; label: string; sub: string; href?: string; lat: number; lon: number };

const PLACES: Place[] = [
  { id: "brief",   icon: "✉️", label: "Brief",         sub: "formell schreiben",  lat:   8, lon:    0 },
  { id: "frist",   icon: "⏱️", label: "Frist",         sub: "Ablauf berechnen",   lat:  34, lon:   76, href: "/fristenrechner" },
  { id: "weg",     icon: "🧭", label: "Wegweiser",     sub: "wer ist zuständig",  lat: -22, lon:   52, href: "/wegweiser" },
  { id: "belege",  icon: "📁", label: "Belege",        sub: "Beweise sammeln",    lat: -34, lon:  -66, href: "/belegmappe" },
  { id: "busse",   icon: "🚗", label: "Ordnungsbusse", sub: "Einsprache & Frist", lat:  46, lon:  -98, href: "/ordnungsbusse-einsprache-frist" },
  { id: "kk",      icon: "🏥", label: "Krankenkasse",  sub: "Rechnung abgelehnt", lat: -10, lon:  148, href: "/krankenkasse-rechnung-abgelehnt" },
  { id: "kaution", icon: "🏠", label: "Kaution",       sub: "zurückfordern",      lat:  24, lon: -168, href: "/vermieter-kaution-zurueckfordern" },
];

// ── rotation (identical to globus/app.html) ──
type M = number[];
type V = { x: number; y: number; z: number };
const mul = (a: M, b: M): M => [
  a[0]*b[0]+a[1]*b[3]+a[2]*b[6], a[0]*b[1]+a[1]*b[4]+a[2]*b[7], a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
  a[3]*b[0]+a[4]*b[3]+a[5]*b[6], a[3]*b[1]+a[4]*b[4]+a[5]*b[7], a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
  a[6]*b[0]+a[7]*b[3]+a[8]*b[6], a[6]*b[1]+a[7]*b[4]+a[8]*b[7], a[6]*b[2]+a[7]*b[5]+a[8]*b[8]];
const rotY = (t: number): M => [Math.cos(t),0,Math.sin(t), 0,1,0, -Math.sin(t),0,Math.cos(t)];
const rotX = (t: number): M => [1,0,0, 0,Math.cos(t),-Math.sin(t), 0,Math.sin(t),Math.cos(t)];
const ap = (m: M, v: V): V => ({
  x: m[0]*v.x + m[1]*v.y + m[2]*v.z,
  y: m[3]*v.x + m[4]*v.y + m[5]*v.z,
  z: m[6]*v.x + m[7]*v.y + m[8]*v.z,
});
const toVec = (lat: number, lon: number): V => {
  const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
  return { x: Math.cos(la) * Math.cos(lo), y: Math.sin(la), z: Math.cos(la) * Math.sin(lo) };
};

const CX = 100, CY = 100, RS = 72, D = RS * 3.2;

/** Perspective projection, as in Globus: the near side is magnified by f.
 *  Screen y grows downward, which is why a drag negates dy. */
function project(rot: M, v: V) {
  const p = ap(rot, v);
  const f = D / (D - p.z * RS);
  return { X: CX + p.x * RS * f, Y: CY + p.y * RS * f, z: p.z, f };
}

export default function GlobeNav({ onOpenBrief }: { onOpenBrief: () => void }) {
  const rot = useRef<M>([1,0,0, 0,1,0, 0,0,1]);
  const vel = useRef({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [, force] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const tick = () => {
      if (!drag.current) {
        const v = vel.current;
        if (Math.abs(v.x) > 1e-4 || Math.abs(v.y) > 1e-4) {
          rot.current = mul(mul(rotY(v.x), rotX(v.y)), rot.current);
          v.x *= 0.95; v.y *= 0.95;
          force((n) => n + 1);
        } else if (!reduce) {
          rot.current = mul(rotY(0.0011), rot.current);
          force((n) => n + 1);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const spin = (dx: number, dy: number) => {
    rot.current = mul(mul(rotY(dx), rotX(dy)), rot.current);
    force((n) => n + 1);
  };

  function go(place: Place) {
    if (drag.current?.moved) return;           // a turn is not a click
    if (place.href) window.location.href = place.href;
    else onOpenBrief();
  }

  /* Graticule split at the horizon: near half solid, far half dashed. Drawing
   * both halves is what lets you see through the sphere. */
  const nearLines: { d: string; major: boolean }[] = [];
  const farLines: { d: string; major: boolean }[] = [];
  const meridians: { lat?: number; lon?: number; major: boolean }[] = [];
  for (let lat = -75; lat <= 75; lat += 15) meridians.push({ lat, major: lat === 0 });
  for (let lon = 0; lon < 180; lon += 15) meridians.push({ lon, major: lon === 0 });

  for (const m of meridians) {
    let dN = "", dF = "", penN = false, penF = false;
    for (let t = 0; t <= 360; t += 5) {
      const lat = m.lat !== undefined ? m.lat : (t <= 180 ? t - 90 : 90 - (t - 180));
      const lon = m.lat !== undefined ? t : (m.lon! + (t <= 180 ? 0 : 180));
      const q = project(rot.current, toVec(lat, lon));
      const seg = `${q.X.toFixed(1)} ${q.Y.toFixed(1)}`;
      if (q.z >= 0) { dN += (penN ? "L" : "M") + seg; penN = true; penF = false; }
      else          { dF += (penF ? "L" : "M") + seg; penF = true; penN = false; }
    }
    if (dN) nearLines.push({ d: dN, major: m.major });
    if (dF) farLines.push({ d: dF, major: m.major });
  }

  const sites = PLACES.map((p) => ({ p, ...project(rot.current, toVec(p.lat, p.lon)) }))
                      .sort((a, b) => a.z - b.z);

  return (
    <div
      className="globenav"
      onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, moved: false }; vel.current = { x: 0, y: 0 }; }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x, dy = e.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) < 4) return;
        d.moved = true;
        const k = 0.006;
        spin(dx * k, -dy * k);
        vel.current = { x: dx * k * 0.5, y: -dy * k * 0.5 };
        d.x = e.clientX; d.y = e.clientY;
      }}
      onPointerUp={() => { drag.current = null; }}
      onPointerLeave={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
    >
      <svg viewBox="0 0 200 200" role="navigation" aria-label="Bereiche">
        {farLines.map((l, i) => <path key={`f${i}`} className={`gn-grat far${l.major ? " major" : ""}`} d={l.d} />)}
        <circle className="gn-glass" cx={CX} cy={CY} r={RS} />
        {nearLines.map((l, i) => <path key={`n${i}`} className={`gn-grat${l.major ? " major" : ""}`} d={l.d} />)}

        {sites.map(({ p, X, Y, z, f }) => {
          const nr = (z + 1) / 2;
          const op = 0.3 + 0.7 * Math.pow(nr, 1.6);
          const r = 2.94 * f;   // = Globus's 15px at Rs 367, rescaled to RS 72
          const on = hover === p.id;
          const live = nr > 0.38;                 // the far side is visible, not clickable
          return (
            <g
              key={p.id}
              className="gn-node"
              opacity={op.toFixed(2)}
              style={{ pointerEvents: live ? "auto" : "none" }}
              tabIndex={live ? 0 : -1}
              role="link"
              aria-label={`${p.label} — ${p.sub}`}
              onPointerUp={(e) => { e.stopPropagation(); go(p); }}
              onPointerEnter={() => setHover(p.id)}
              onPointerLeave={() => setHover(null)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(p); } }}
            >
              <circle className="gn-hit" cx={X} cy={Y} r={r + 3} />
              <circle className={`gn-halo${on ? " on" : ""}`} cx={X} cy={Y} r={r + 1.37} />
              <circle className="gn-dot" cx={X} cy={Y} r={r} />
              <text className="gn-icon" x={X} y={Y} fontSize={(2.75 * f).toFixed(2)}>{p.icon}</text>
              {nr > 0.42 && (
                <>
                  <text className="gn-label" x={X} y={Y + r + 2.55 * f} fontSize={(2.16 * f).toFixed(2)}>{p.label}</text>
                  <text className="gn-sub" x={X} y={Y + r + 4.71 * f} fontSize={(1.69 * f).toFixed(2)}>{p.sub}</text>
                </>
              )}
            </g>
          );
        })}

        {/* Poles fix an up and a down for the rotation. */}
        {([{ v: { x: 0, y: 1, z: 0 }, t: "N" }, { v: { x: 0, y: -1, z: 0 }, t: "S" }] as const).map((pole) => {
          const q = project(rot.current, pole.v);
          if (q.z < 0) return null;
          return (
            <g key={pole.t}>
              <circle cx={q.X} cy={q.Y} r={0.51} fill="var(--brass)" fillOpacity={0.75} />
              <text className="gn-pole" x={q.X} y={q.Y - 1.6}>{pole.t}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
