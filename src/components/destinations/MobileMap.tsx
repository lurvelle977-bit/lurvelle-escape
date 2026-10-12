"use client";

import { useEffect, useRef } from "react";
import { HOME_LOCATION } from "@/data/destinations";
import { MAP_HEIGHT, MAP_WIDTH, mapCountries } from "@/data/portugalMap";
import type { Destination } from "@/types";
import { projectToMobileMap } from "@/utils/geo";

type MobileMapProps = {
  destinations: Destination[];
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
export default function MobileMap({ destinations, activeId, onSelect }: MobileMapProps) {
  const routeRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  const [homeX, homeY] = projectToMobileMap(HOME_LOCATION.lon, HOME_LOCATION.lat);
  const active = destinations.find((d) => d.id === activeId) ?? destinations[0];
  const [activeX, activeY] = projectToMobileMap(active.lon, active.lat);
  const showRoute = Math.hypot(activeX - homeX, activeY - homeY) >= 6;

  // Curved route from Lisbon to the active destination
  const controlX = (homeX + activeX) / 2 + (homeY - activeY) * 0.3;
  const controlY = (homeY + activeY) / 2 + (activeX - homeX) * 0.3;
  const routePath = `M ${homeX} ${homeY} Q ${controlX} ${controlY} ${activeX} ${activeY}`;

  // Animate the dashed route and the travelling dot
  useEffect(() => {
    const path = routeRef.current;
    const dot = dotRef.current;
    if (!showRoute || !path || !dot) return;
    const total = path.getTotalLength();
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

  return (
    <div className="relative mx-[-8px] mt-7">
      <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} width="100%" className="block">
        {/* Countries */}
        <g>
          {mapCountries.map((country) => {
            const portugal = country.name === "Portugal";
            return (
              <path
                key={country.name}
                d={country.d}
                fill={portugal ? "rgba(245,243,234,0.07)" : "rgba(245,243,234,0.025)"}
                stroke={portugal ? "rgba(198,161,91,0.45)" : "rgba(245,243,234,0.1)"}
                strokeWidth={portugal ? 1.1 : 0.6}
              />
            );
          })}
        </g>
        <text
          x={MAP_WIDTH - 20}
          y={80}
          textAnchor="end"
          fontFamily="var(--font-playfair), serif"
          fontSize={17}
          letterSpacing={7}
          fill="rgba(245,243,234,0.25)"
        >
          PORTUGAL
        </text>

        {/* Route */}
        {showRoute && (
          <g>
            <path
              key={routePath}
              ref={routeRef}
              d={routePath}
              fill="none"
              stroke="#C6A15B"
              strokeWidth={1.3}
              strokeDasharray="0 1000"
              strokeLinecap="round"
              opacity={0.85}
            />
            <circle ref={dotRef} r={2.2} fill="#DCBD82" opacity={0} />
          </g>
        )}

        {/* "You are here" marker */}
        <g transform={`translate(${homeX},${homeY})`}>
          <circle r={6} fill="none" stroke="#F5F3EA" strokeWidth={1} className="animate-[homePulse_2.2s_ease-out_infinite]" />
          <circle r={3} fill="#F5F3EA" />
          <text
            x={-10}
            y={20}
            textAnchor="end"
            fontSize={8}
            fontWeight={600}
            letterSpacing={1.2}
            fill="rgba(245,243,234,0.6)"
          >
            YOU ARE HERE · LISBON
          </text>
        </g>

        {/* Destination pins */}
        {destinations.map((destination, index) => {
          const [x, y] = projectToMobileMap(destination.lon, destination.lat);
          const on = destination.id === activeId;
          return (
            <g key={destination.id} transform={`translate(${x},${y})`}>
              <g
                className="cursor-pointer"
                onClick={() => onSelect(destination.id)}
                style={{
                  animation: `pinPop 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.15 + index * 0.08}s both`,
                  transformBox: "view-box",
                  transformOrigin: "0 0",
                }}
              >
                {/* Generous invisible tap target */}
                <circle r={20} fill="transparent" />
                {on && <circle r={12} fill="none" stroke="#C6A15B" strokeOpacity={0.45} strokeWidth={1} />}
                <circle r={on ? 6 : 4.5} fill={on ? "#C6A15B" : "#1A1812"} stroke="#C6A15B" strokeWidth={1.3} />
                <text
                  x={destination.mobileDx}
                  y={destination.mobileDy}
                  textAnchor={destination.mobileDx < 0 ? "end" : "start"}
                  fontSize={8.5}
                  fontWeight={600}
                  letterSpacing={1.2}
                  fill={on ? "#C6A15B" : "#8B8776"}
                >
                  {destination.mapLabel}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
