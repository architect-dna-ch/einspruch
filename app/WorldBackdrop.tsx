/* Wireframe globe behind every page — an orthographic sphere with a graticule.
 * Meridians are ellipses whose x-radius shrinks toward the limb, which is what
 * makes a flat circle read as a turning ball. */
export default function WorldBackdrop() {
  const parallels = [-60, -30, 0, 30, 60];
  const meridians = [90, 68, 42, 0];

  return (
    <div className="worldbg" aria-hidden="true">
      <svg viewBox="0 0 200 200">
        <circle className="sphere" cx="100" cy="100" r="78" />
        <g className="spin">
          {parallels.map((lat) => {
            const y = 100 - (lat / 90) * 78;
            const rx = 78 * Math.cos((lat * Math.PI) / 180);
            return <ellipse key={lat} className={`grat${lat === 0 ? " major" : ""}`} cx="100" cy={y} rx={rx} ry={rx * 0.16} />;
          })}
          {meridians.map((rx) => (
            <ellipse key={rx} className={`grat${rx === 0 ? " major" : ""}`} cx="100" cy="100" rx={Math.max(rx * 0.87, 0.4)} ry="78" />
          ))}
        </g>
      </svg>
    </div>
  );
}
