"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import type { Tour } from "@/content/tours";
import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";
import { HOME_LOCATION } from "./data/filters";
import { MAP_HEIGHT, MAP_WIDTH, mapCountries } from "./data/portugalMap";
import { projectToMobileMap } from "./lib/projection";

type MobileMapProps = {
  tours: Tour[];
  visibleIds: string[];
  activeId: string;
  onSelect: (id: string) => void;
};

// Route drawing length in milliseconds
const ROUTE_DURATION = 900;

// Cubic ease-out used for the route drawing
const easeCubicOut = (t: number) => 1 - (1 - t) ** 3;

// Dash pattern that reveals a 4/5 dashed line up to the drawn length
function dashedReveal(drawn: number, total: number) {
  const dash: number[] = [];
  let acc = 0;
  while (acc < drawn) {
    dash.push(Math.min(4, drawn - acc));
    acc += 4;
    dash.push(Math.min(5, Math.max(0, drawn - acc)));
    acc += 5;
  }
  dash.push(0, total);
  return dash.join(" ");
}

// Mobile SVG map of Portugal with pins and an animated dashed route
export default function MobileMap({ tours, visibleIds, activeId, onSelect }: MobileMapProps) {
  const routeRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  const [homeX, homeY] = projectToMobileMap(HOME_LOCATION.lon, HOME_LOCATION.lat);
  const active = tours.find((t) => t.id === activeId) ?? tours[0];
  const [activeX, activeY] = projectToMobileMap(active.lon, active.lat);
  const showRoute = visibleIds.includes(active.id) && Math.hypot(activeX - homeX, activeY - homeY) >= 6;

  // Curved route from Lisbon to the active tour
  const controlX = (homeX + activeX) / 2 + (homeY - activeY) * 0.3;
  const controlY = (homeY + activeY) / 2 + (activeX - homeX) * 0.3;
  const routePath = `M ${homeX} ${homeY} Q ${controlX} ${controlY} ${activeX} ${activeY}`;

  // Animate the dashed route and the travelling dot
  useEffect(() => {
    const path = routeRef.current;
    const dot = dotRef.current;
    if (!showRoute || !path || !dot) return;
    const total = path.getTotalLength();

    // Reduced motion: show the finished route straight away
    if (prefersReducedMotion()) {
      path.setAttribute("stroke-dasharray", "4 5");
      return;
    }

    const start = performance.now();
    let frame = 0;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;

    dot.style.transition = "none";
    dot.style.opacity = "1";

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ROUTE_DURATION);
      const drawn = total * easeCubicOut(t);
      path.setAttribute("stroke-dasharray", dashedReveal(drawn, total));
      const point = path.getPointAtLength(drawn);
      dot.setAttribute("transform", `translate(${point.x},${point.y})`);
      if (t < 1) {
        frame = requestAnimationFrame(step);
      } else {
        // Fade the dot out once the route is drawn
        fadeTimer = setTimeout(() => {
          dot.style.transition = "opacity 0.3s";
          dot.style.opacity = "0";
        });
      }
    };
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(fadeTimer);
    };
  }, [routePath, showRoute]);

  // Enter or Space selects a focused pin
  const handleKey = (event: KeyboardEvent, id: string) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(id);
  };

  return (
    <div className="relative mx-[-8px] mt-7">
      <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} width="100%" className="block" role="group" aria-label="Map of destinations">
        {/* Countries */}
        <g aria-hidden="true">
          {mapCountries.map((country) => {
            const portugal = country.name === "Portugal";
            return (
              <path
                key={country.name}
                d={country.d}
                className={portugal ? "fill-cream/7 stroke-gold/45" : "fill-cream/2.5 stroke-cream/10"}
                strokeWidth={portugal ? 1.1 : 0.6}
              />
            );
          })}
          <text
            x={MAP_WIDTH - 20}
            y={80}
            textAnchor="end"
            fontSize={17}
            letterSpacing={7}
            className="fill-cream/25 font-serif"
          >
            PORTUGAL
          </text>
        </g>

        {/* Route */}
        {showRoute && (
          <g aria-hidden="true">
            <path
              key={routePath}
              ref={routeRef}
              d={routePath}
              fill="none"
              strokeWidth={1.3}
              strokeDasharray="0 1000"
              strokeLinecap="round"
              opacity={0.85}
              className="stroke-gold"
            />
            <circle ref={dotRef} r={2.2} opacity={0} className="fill-gold-light" />
          </g>
        )}

        {/* "You are here" marker */}
        <g transform={`translate(${homeX},${homeY})`} aria-hidden="true">
          <circle r={6} fill="none" strokeWidth={1} className="animate-[homePulse_2.2s_ease-out_infinite] stroke-cream" />
          <circle r={3} className="fill-cream" />
          <text x={-10} y={20} textAnchor="end" fontSize={8} fontWeight={600} letterSpacing={1.2} className="fill-cream/60">
            YOU ARE HERE · LISBON
          </text>
        </g>

        {/* Tour pins */}
        {tours.map((tour, index) => {
          const [x, y] = projectToMobileMap(tour.lon, tour.lat);
          const on = tour.id === activeId;
          const visible = visibleIds.includes(tour.id);
          return (
            // Dimming sits on the outer group because the pop-in animation owns the inner opacity
            <g key={tour.id} transform={`translate(${x},${y})`} className={cn("transition-opacity duration-300", !visible && "opacity-25")}>
              <g
                role="button"
                tabIndex={visible ? 0 : -1}
                aria-label={tour.name}
                aria-pressed={on}
                aria-disabled={!visible}
                onClick={visible ? () => onSelect(tour.id) : undefined}
                onKeyDown={visible ? (event) => handleKey(event, tour.id) : undefined}
                className={cn("group outline-none", visible && "cursor-pointer")}
                style={{
                  animation: `pinPop 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.15 + index * 0.08}s both`,
                  transformBox: "view-box",
                  transformOrigin: "0 0",
                }}
              >
                {/* Generous invisible tap target */}
                <circle r={20} fill="transparent" />
                {/* Keyboard focus ring */}
                <circle r={15} fill="none" strokeWidth={1.5} className="stroke-gold-light opacity-0 group-focus-visible:opacity-100" />
                {on && <circle r={12} fill="none" strokeWidth={1} className="stroke-gold/45" />}
                <circle r={on ? 6 : 4.5} strokeWidth={1.3} className={cn("stroke-gold", on ? "fill-gold" : "fill-charcoal")} />
                <text
                  x={tour.mobileLabel.dx}
                  y={tour.mobileLabel.dy}
                  textAnchor={tour.mobileLabel.dx < 0 ? "end" : "start"}
                  fontSize={8.5}
                  fontWeight={600}
                  letterSpacing={1.2}
                  aria-hidden="true"
                  className={on ? "fill-gold" : "fill-muted"}
                >
                  {tour.mapLabel}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
