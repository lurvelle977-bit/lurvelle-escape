"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-map.css";
import { useEffect, useRef } from "react";
import type { Tour } from "@/content/tours";
import { prefersReducedMotion } from "@/lib/motion";
import DestinationCard from "./DestinationCard";
import { HOME_LOCATION } from "./data/filters";
import { describeRoute, getRoute, isInCity } from "./lib/geo";

type LeafletMapProps = {
  tours: Tour[];
  visibleIds: string[];
  activeId: string;
  onSelect: (id: string) => void;
};

// Tile server: set a commercial provider (MapTiler, Stadia, …) in production; OSM is for development only
const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Detail card size used to keep it inside the map
const CARD_WIDTH = 280;
const CARD_HEIGHT = 330;

// Desktop dark Leaflet map with pins, animated route and floating detail card
export default function LeafletMap({ tours, visibleIds, activeId, onSelect }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const activeRef = useRef(activeId);
  const onSelectRef = useRef(onSelect);

  const active = tours.find((t) => t.id === activeId) ?? tours[0];
  const hasVisible = visibleIds.length > 0;

  // Keep the latest values for Leaflet event handlers
  useEffect(() => {
    activeRef.current = activeId;
    onSelectRef.current = onSelect;
  });

  // Dock the card on the side away from the active pin so its label stays clear
  const positionCard = () => {
    const map = mapRef.current;
    const card = cardRef.current;
    const current = tours.find((t) => t.id === activeRef.current);
    if (!map || !card || !current) return;
    const point = map.latLngToContainerPoint([current.lat, current.lon]);
    const { x: mapWidth, y: mapHeight } = map.getSize();
    const dockRight = point.x < mapWidth / 2;
    card.style.left = dockRight ? "auto" : "16px";
    card.style.right = dockRight ? "16px" : "auto";
    card.style.bottom = "auto";
    let top = point.y - CARD_HEIGHT / 2;
    // If the pin sits under the docked column, slide the card above or below it
    const inColumn = dockRight ? point.x > mapWidth - CARD_WIDTH - 140 : point.x < CARD_WIDTH + 140;
    if (inColumn) top = point.y + 40 + CARD_HEIGHT <= mapHeight - 8 ? point.y + 40 : point.y - 40 - CARD_HEIGHT;
    card.style.top = `${Math.max(8, Math.min(top, mapHeight - CARD_HEIGHT - 8))}px`;
  };
  const positionCardRef = useRef(positionCard);
  useEffect(() => {
    positionCardRef.current = positionCard;
  });

  // Create the map, tiles, home marker and tour pins once
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
      zoomSnap: 0.25,
    });
    mapRef.current = map;

    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
    map.fitBounds(
      [
        [36.9, -9.7],
        [41.5, -7.4],
      ],
      { padding: [30, 30] },
    );
    map.zoomControl.setPosition("bottomleft");

    // "You are here" marker
    L.marker([HOME_LOCATION.lat, HOME_LOCATION.lon], {
      interactive: false,
      keyboard: false,
      zIndexOffset: 500,
      icon: L.divIcon({
        className: "",
        iconSize: [8, 8],
        iconAnchor: [4, 4],
        html: '<div class="map-home"><span class="ring"></span><span class="core"></span><span class="lbl">YOU ARE HERE · LISBON</span></div>',
      }),
    }).addTo(map);

    // Tour pins with staggered pop-in (Leaflet makes them keyboard-focusable)
    tours.forEach((tour, index) => {
      const left = tour.labelSide === "left";
      const icon = L.divIcon({
        className: "",
        iconSize: [10, 10],
        iconAnchor: left ? [10, 5] : [0, 5],
        html: `<div class="map-pin ${left ? "left" : ""}" style="position:absolute;top:0;${left ? "right:0" : "left:0"};animation-delay:${0.15 + index * 0.08}s"><span class="dot"></span><span class="lbl">${tour.mapLabel}</span></div>`,
      });
      markersRef.current[tour.id] = L.marker([tour.lat, tour.lon], { icon, riseOnHover: true, title: tour.name, alt: tour.name })
        .addTo(map)
        .on("click", () => onSelectRef.current(tour.id));
    });

    const reposition = () => positionCardRef.current();
    map.on("move zoom", reposition);
    window.addEventListener("resize", reposition);

    return () => {
      window.removeEventListener("resize", reposition);
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [tours]);

  // Highlight the active pin, dim filtered-out pins and move the card
  useEffect(() => {
    tours.forEach((tour) => {
      const marker = markersRef.current[tour.id];
      const element = marker?.getElement();
      const pin = element?.querySelector(".map-pin");
      if (!marker || !element || !pin) return;
      const visible = visibleIds.includes(tour.id);
      pin.classList.toggle("on", tour.id === activeId && visible);
      pin.classList.toggle("dim", !visible);
      // Filtered-out pins leave the tab order too
      element.tabIndex = visible ? 0 : -1;
      marker.setZIndexOffset(tour.id === activeId ? 400 : 0);
    });
    positionCardRef.current();
  }, [tours, visibleIds, activeId]);

  // Draw the precomputed driving route with a drawing animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasVisible || isInCity(active)) return;

    const route = getRoute(active);
    // Straight dashed line if no route was generated for this tour
    const points: [number, number][] = route?.points ?? [
      [HOME_LOCATION.lat, HOME_LOCATION.lon],
      [active.lat, active.lon],
    ];
    const line = L.polyline(points, {
      // SVG attributes cannot read CSS variables, so resolve the theme colour here
      color: getComputedStyle(document.documentElement).getPropertyValue("--color-gold").trim(),
      weight: route ? 2 : 1.4,
      opacity: 0.85,
      dashArray: route ? undefined : "5 6",
      lineCap: "round",
      lineJoin: "round",
      interactive: false,
    }).addTo(map);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const path = line.getElement() as SVGPathElement | undefined;
    if (path && !prefersReducedMotion()) {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.style.animation = "routeDraw 1.1s cubic-bezier(0.22,1,0.36,1) forwards";
      timer = setTimeout(() => {
        path.style.animation = "";
        path.style.strokeDasharray = route ? "" : "5 6";
        path.style.strokeDashoffset = "0";
      }, 1150);
    }

    return () => {
      clearTimeout(timer);
      map.removeLayer(line);
    };
  }, [active, hasVisible]);

  return (
    <section aria-label="Map of destinations" className="sticky top-[110px]">
      <div ref={containerRef} className="destinations-map h-[clamp(560px,calc(100vh_-_200px),900px)]" />

      {/* Floating detail card */}
      <div
        ref={cardRef}
        className="absolute right-6 bottom-6 z-[1000] w-[280px] overflow-hidden rounded-[2px] bg-charcoal/92 shadow-gold-frame backdrop-blur-[16px]"
        hidden={!hasVisible}
      >
        <DestinationCard key={active.id} tour={active} variant="desktop" routeInfo={describeRoute(active)} />
      </div>
    </section>
  );
}
