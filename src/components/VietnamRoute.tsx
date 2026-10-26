import map from "@/content/vietnam-map.json";
import styles from "./VietnamRoute.module.css";

// Vietnam with the usual road from Saigon to Hanoi, drawn from
// src/content/vietnam-map.json (made by scripts/brand/vietnam-map.mjs).
// Pure SVG: no map library, no requests.

const DOT = { start: 6, dropoff: 6, stop: 3.5 } as const;

export function VietnamRoute() {
  return (
    <svg
      viewBox={`0 0 ${map.width} ${map.height}`}
      className={styles.map}
      role="img"
      aria-label="Map of Vietnam: the road from Saigon through Da Lat, Nha Trang, Hoi An, Da Nang, Hue, Phong Nha and Ninh Binh to Hanoi"
    >
      <path d={map.neighbours} className={styles.neighbours} />
      <path d={map.vietnam} className={styles.vietnam} />
      {map.labels.map((l) => (
        <text key={l.name} x={l.at[0]} y={l.at[1]} className={styles.country}>
          {l.name}
        </text>
      ))}
      <path d={map.road} pathLength={1} className={styles.roadGlow} />
      <path d={map.road} pathLength={1} className={styles.road} />
      {map.places.map((p) => {
        const kind = p.kind as keyof typeof DOT;
        const right = p.side === "right";
        const gap = DOT[kind] + 5;
        return (
          <g key={p.name} className={styles[kind]}>
            <circle cx={p.at[0]} cy={p.at[1]} r={DOT[kind]} />
            <text
              x={p.at[0] + (right ? gap : -gap)}
              y={p.at[1] + 4 + ("dy" in p ? Number(p.dy) : 0)}
              textAnchor={right ? "start" : "end"}
            >
              {p.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
