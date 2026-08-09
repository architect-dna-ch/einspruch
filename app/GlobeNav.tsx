"use client";

import { useEffect, useRef, useState } from "react";

/* Navigation as a world you turn, not a menu you read.
 *
 * Each section of Einspruch is a place on a sphere: drag to turn, click a place
 * to go there. The rotation math is the same orthographic projection Globus uses
 * — a 3×3 matrix accumulated per drag, so the globe has no "up" it snaps back to. */

type Place = { id: string; icon: string; label: string; sub: string; href?: string; lat: number; lon: number };

const PLACES: Place[] = [
  { id: "brief",   icon: "✉️", label: "Brief",      sub: "formell schreiben",       lat:   8, lon:   0 },
  { id: "frist",   icon: "⏱️", label: "Frist",      sub: "Ablauf berechnen",        lat:  34, lon:  76, href: "/fristenrechner" },
  { id: "weg",     icon: "🧭", label: "Wegweiser",  sub: "wer ist zuständig",       lat: -22, lon:  52, href: "/wegweiser" },
  { id: "belege",  icon: "📁", label: "Belege",     sub: "Beweise sammeln",         lat: -34, lon: -66, href: "/belegmappe" },
  { id: "busse",   icon: "🚗", label: "Ordnungsbusse", sub: "Einsprache & Frist",   lat:  46, lon: -98, href: "/ordnungsbusse-einsprache-frist" },
  { id: "kk",      icon: "🏥", label: "Krankenkasse", sub: "Rechnung abgelehnt",    lat: -10, lon: 148, href: "/krankenkasse-rechnung-abgelehnt" },
  { id: "kaution", icon: "🏠", label: "Kaution",    sub: "zurückfordern",           lat:  24, lon: -168, href: "/vermieter-kaution-zurueckfordern" },
];

// ── rotation ──
type M = number[];
const mul = (a: M, b: M): M => [
  a[0]*b[0]+a[1]*b[3]+a[2]*b[6], a[0]*b[1]+a[1]*b[4]+a[2]*b[7], a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
  a[3]*b[0]+a[4]*b[3]+a[5]*b[6], a[3]*b[1]+a[4]*b[4]+a[5]*b[7], a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
  a[6]*b[0]+a[7]*b[3]+a[8]*b[6], a[6]*b[1]+a[7]*b[4]+a[8]*b[7], a[6]*b[2]+a[7]*b[5]+a[8]*b[8]];
const rotY = (t: number): M => [Math.cos(t),0,Math.sin(t), 0,1,0, -Math.sin(t),0,Math.cos(t)];
const rotX = (t: number): M => [1,0,0, 0,Math.cos(t),-Math.sin(t), 0,Math.sin(t),Math.cos(t)];
type V = { x: number; y: number; z: number };
const ap = (m: M, v: V): V => ({
  x: m[0]*v.x + m[1]*v.y + m[2]*v.z,
  y: m[3]*v.x + m[4]*v.y + m[5]*v.z,
  z: m[6]*v.x + m[7]*v.y + m[8]*v.z,
});
const toVec = (lat: number, lon: number): V => {
  const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
  return { x: Math.cos(la) * Math.sin(lo), y: Math.sin(la), z: Math.cos(la) * Math.cos(lo) };
};

const R = 78;          // sphere radius in viewBox units
const CX = 100, CY = 100;

export default function GlobeNav({ onOpenBrief }: { onOpenBrief: () => void }) {
  const rot = useRef<M>([1,0,0, 0,1,0, 0,0,1]);
  const vel = useRef({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [, force] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  // Idle drift plus inertia after a drag, so the world always feels alive.
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
          rot.current = mul(rotY(0.0012), rot.current);
          force((n) => n + 1);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function spin(dx: number, dy: number) {
    rot.current = mul(mul(rotY(dx), rotX(dy)), rot.current);
    force((n) => n + 1);
  }

  const projected = PLACES.map((p) => {
    const v = ap(rot.current, toVec(p.lat, p.lon));
    return { p, X: CX + v.x * R, Y: CY - v.y * R, z: v.z };
  }).sort((a, b) => a.z - b.z);

  function go(place: Place) {
    if (drag.current?.moved) return;          // a turn is not a click
    if (place.href) window.location.href = place.href;
    else onOpenBrief();
  }

  // Graticule: parallels as flattened ellipses, meridians as great circles.
  const grat: string[] = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts: string[] = [];
    for (let lon = 0; lon <= 360; lon += 6) {
      const v = ap(rot.current, toVec(lat, lon));
      if (v.z < 0) { pts.push(""); continue; }
      pts.push(`${(CX + v.x * R).toFixed(1)} ${(CY - v.y * R).toFixed(1)}`);
    }
    grat.push(pts.filter(Boolean).map((s, i) => (i ? "L" : "M") + s).join(""));
  }
  for (let lon = 0; lon < 180; lon += 30) {
    const pts: string[] = [];
    for (let t = 0; t <= 360; t += 6) {
      const lat = t <= 180 ? t - 90 : 90 - (t - 180);
      const v = ap(rot.current, toVec(lat, lon + (t <= 180 ? 0 : 180)));
      if (v.z < 0) { pts.push(""); continue; }
      pts.push(`${(CX + v.x * R).toFixed(1)} ${(CY - v.y * R).toFixed(1)}`);
    }
    grat.push(pts.filter(Boolean).map((s, i) => (i ? "L" : "M") + s).join(""));
  }

  return (
    <div
      className="globenav"
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, y: e.clientY, moved: false };
        vel.current = { x: 0, y: 0 };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x, dy = e.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) < 4) return;
        d.moved = true;
        const k = 0.007;
        spin(dx * k, -dy * k);
        vel.current = { x: dx * k * 0.5, y: -dy * k * 0.5 };
        d.x = e.clientX; d.y = e.clientY;
      }}
      onPointerUp={() => { setTimeout(() => { drag.current = null; }, 0); }}
      onPointerCancel={() => { drag.current = null; }}
    >
      <svg viewBox="0 0 200 200" role="navigation" aria-label="Bereiche">
        <circle className="gn-sphere" cx={CX} cy={CY} r={R} />
        {grat.map((d, i) => (
          <path key={i} className="gn-grat" d={d} />
        ))}

        {projected.map(({ p, X, Y, z }) => {
          if (z < -0.15) return null;                 // behind the globe
          const near = (z + 1) / 2;
          const on = hover === p.id;
          const r = 11 + near * 3;
          return (
            <g
              key={p.id}
              className="gn-node"
              opacity={(0.3 + 0.7 * Math.pow(near, 1.4)).toFixed(2)}
              onClick={() => go(p)}
              onPointerEnter={() => setHover(p.id)}
              onPointerLeave={() => setHover(null)}
              tabIndex={0}
              role="link"
              aria-label={p.label}
              onKeyDown={(e) => { if (e.key === "Enter") go(p); }}
            >
              <circle className="gn-hit" cx={X} cy={Y} r={r + 10} />
              <circle className={`gn-halo${on ? " on" : ""}`} cx={X} cy={Y} r={r + 4} />
              <circle className={`gn-dot${on ? " on" : ""}`} cx={X} cy={Y} r={r} />
              <text className="gn-icon" x={X} y={Y + 4} textAnchor="middle">{p.icon}</text>
              {near > 0.42 && (
                <>
                  <text className="gn-label" x={X} y={Y + r + 9} textAnchor="middle">{p.label}</text>
                  {on && <text className="gn-sub" x={X} y={Y + r + 16} textAnchor="middle">{p.sub}</text>}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
