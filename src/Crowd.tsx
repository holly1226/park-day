import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Visitor, Facility } from "./data";

gsap.registerPlugin(useGSAP);
const fallbackRoute = [
  { x: 330, y: 550 },
  { x: 330, y: 325 },
  { x: 803, y: 325 },
  { x: 803, y: 510 },
  { x: 330, y: 510 },
  { x: 330, y: 325 },
  { x: 110, y: 325 },
  { x: 330, y: 325 },
  { x: 330, y: 90 },
  { x: 330, y: 550 },
];
export default function Crowd({
  visitors,
  motion,
  layout,
}: {
  visitors: Visitor[];
  motion: boolean;
  layout: Facility[];
}) {
  const root = useRef<SVGGElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", all: "(min-width: 0px)" },
        (context) => {
          root.current
            ?.querySelectorAll<SVGGElement>(".walking-person")
            .forEach((el) => {
              const seed = Number(el.dataset.seed);
              const lane = (seed - 0.5) * 10;
              const f = layout.find((f) => f.id === el.dataset.target);
              let route = fallbackRoute;
              if (f) {
                const approach =
                  f.y < 280
                    ? f.x <= 550
                      ? [
                          { x: 330, y: 325 },
                          { x: 330, y: f.y },
                          { x: f.x, y: f.y },
                        ]
                      : [
                          { x: 803, y: 325 },
                          { x: 803, y: f.y },
                          { x: f.x, y: f.y },
                        ]
                    : [
                        { x: 330, y: 325 },
                        { x: f.x, y: 325 },
                        { x: f.x, y: f.y },
                      ];
                route = [
                  { x: 330, y: 550 },
                  { x: 330, y: 325 },
                  ...approach,
                  ...[...approach].reverse(),
                  { x: 330, y: 325 },
                  { x: 330, y: 550 },
                ];
              }
              const timeline = gsap.timeline({
                repeat: -1,
                paused: !motion || !!context.conditions?.reduce,
                defaults: { ease: "none" },
              });
              gsap.set(el, { x: route[0].x + lane, y: route[0].y });
              route
                .slice(1)
                .forEach((point, i) =>
                  timeline.to(el, {
                    x: point.x + lane,
                    y: point.y + lane,
                    duration:
                      Math.hypot(point.x - route[i].x, point.y - route[i].y) /
                      (26 + seed * 17),
                  }),
                );
              timeline.progress(seed);
            });
        },
      );
      return () => mm.revert();
    },
    {
      scope: root,
      dependencies: [visitors, motion, layout],
      revertOnUpdate: true,
    },
  );
  return (
    <g
      ref={root}
      className="crowd"
      aria-label={`${visitors.length} 位模拟访客，一人一个小人`}
      pointerEvents="none"
    >
      {visitors.map((v) => {
        const color = [
          "#e58b61",
          "#416f95",
          "#f2ca64",
          "#b16985",
          "#f3ecce",
          "#557e69",
        ][v.id % 6];
        return (
          <g
            key={v.id}
            className={`visitor-glyph ${v.state === "walking" ? "walking-person" : "resting-person"}`}
            data-seed={v.seed}
            data-target={v.target ?? ""}
            data-visitor-id={v.id}
            transform={`translate(${v.state === "walking" ? 330 : v.x} ${v.state === "walking" ? 325 : v.y})`}
          >
            <ellipse
              cx="0"
              cy="13"
              rx="6"
              ry="2"
              fill="#254a3c"
              opacity=".18"
            />
            <path
              d="M-3-10h6v3h2v4H-4v-4h1z"
              fill={v.id % 3 === 0 ? "#654d38" : "#44453b"}
            />
            <path
              d="M-3-6h6v6h-6z"
              fill={v.id % 4 === 0 ? "#bd8c68" : "#efcba1"}
            />
            <path d="M-5 0h10v8H-5z" fill={color} />
            <path d="M-7 1h2v6h-2zm12 0h2v6H5z" fill="#e8bd91" />
            <path
              className="visitor-legs"
              d="M-4 8h3v5h-3zm5 0h3v5H1z"
              fill="#394d4d"
            />
            {v.id % 5 === 0 && (
              <path d="M-5-9H5v3H-5zM-2-12h5v3h-5z" fill="#e1bd69" />
            )}
          </g>
        );
      })}
    </g>
  );
}
