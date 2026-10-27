import map from "@/content/vietnam-map.json";
import styles from "./OneWayTrips.module.css";

// Vietnam with the road from Saigon to Hanoi, from src/content/vietnam-map.json
// (made by scripts/brand/vietnam-map.mjs from Natural Earth, public domain).
// Saigon, Da Nang and Hanoi are lanterns; the towns in between are dots.
// It renders complete: OneWayScroll hides the road and dims the lanterns only
// when it is about to animate them.
//
// Hidden from screen readers: the routes list in OneWayTrips says the same.

export function OneWayMap() {
  return (
    <svg
      viewBox={`0 0 ${map.width} ${map.height}`}
      className={styles.map}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="lantern-glow">
          <stop offset="0" stopColor="rgb(255 120 60)" stopOpacity="0.85" />
          <stop offset="0.45" stopColor="rgb(232 85 43)" stopOpacity="0.35" />
          <stop offset="1" stopColor="rgb(232 85 43)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={map.neighbours} className={styles.neighbours} />
      <path d={map.vietnam} className={styles.vietnam} />
      {map.labels.map((l) => (
        <text key={l.name} x={l.at[0]} y={l.at[1]} className={styles.country}>
          {l.name}
        </text>
      ))}
      {/* The whole route, faint, so you can see where the line is heading. */}
      <path d={map.road} className={styles.roadGhost} data-road-ghost />
      <path d={map.road} pathLength={1000} className={styles.roadGlow} data-road />
      <path d={map.road} pathLength={1000} className={styles.road} data-road />
      {map.places.map((p) => {
        const [x, y] = p.at;
        const right = p.side === "right";
        const dy = "dy" in p ? Number(p.dy) : 0;
        if (p.kind === "stop") {
          return (
            <g
              key={p.name}
              className={`${styles.stop} ${styles.lit}`}
              data-place={p.name}
              data-x={x}
              data-y={y}
            >
              <circle cx={x} cy={y} r={3.2} />
              <text x={x + (right ? 8 : -8)} y={y + 4 + dy} textAnchor={right ? "start" : "end"}>
                {p.name}
              </text>
            </g>
          );
        }
        return (
          <g
            key={p.name}
            className={`${styles.lantern} ${styles.lit}`}
            data-place={p.name}
            data-x={x}
            data-y={y}
          >
            <g transform={`translate(${x} ${y})`}>
              <circle r={20} className={styles.glow} />
              <line y1={-12} y2={-8.5} className={styles.hanger} />
              <rect x={-4.5} y={-8.5} width={9} height={2.6} rx={1} className={styles.cap} />
              <ellipse rx={7} ry={6.4} className={styles.body} />
              <path
                d="M0 -6.4 V6.4 M-3.6 -5.6 Q-5.4 0 -3.6 5.6 M3.6 -5.6 Q5.4 0 3.6 5.6"
                className={styles.ribs}
              />
              <rect x={-4} y={5.9} width={8} height={2.4} rx={1} className={styles.cap} />
              <line y1={8.3} y2={12.5} className={styles.tassel} />
            </g>
            <text
              x={x + (right ? 13 : -13)}
              y={y + 5 + dy}
              textAnchor={right ? "start" : "end"}
              className={styles.cityLabel}
            >
              {p.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
