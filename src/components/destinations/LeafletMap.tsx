"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-map.css";
import { useEffect, useRef, useState } from "react";
import { HOME_LOCATION } from "@/data/destinations";
import type { Destination } from "@/types";
import { distanceInMeters, fetchDrivingRoute, formatRoute, type DrivingRoute } from "@/utils/geo";
import DestinationCard from "./DestinationCard";

type LeafletMapProps = {
  destinations: Destination[];
  visibleIds: string[];
  activeId: string;
  onSelect: (id: string) => void;
};

// Detail card size used to keep it inside the map
const CARD_WIDTH = 280;
const CARD_HEIGHT = 330;

// Route result per destination: a driving route, or "failed" if the service was unreachable
type RouteState = Record<string, DrivingRoute | "failed">;

// True when the destination is inside Lisbon itself
function isInCity(destination: Destination) {
  return Math.hypot(destination.lon - HOME_LOCATION.lon, destination.lat - HOME_LOCATION.lat) < 0.05;
}

// Desktop dark Leaflet map with pins, animated route and floating detail card
export default function LeafletMap({ destinations, visibleIds, activeId, onSelect }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const routeRef = useRef<L.Polyline | null>(null);
  const requestedRef = useRef<Set<string>>(new Set());
  const activeRef = useRef(activeId);
  const onSelectRef = useRef(onSelect);
  const [routes, setRoutes] = useState<RouteState>({});

  const active = destinations.find((d) => d.id === activeId) ?? destinations[0];
  const hasVisible = visibleIds.length > 0;
  const activeRoute = routes[active.id];

  // Keep the latest values for Leaflet event handlers
  useEffect(() => {
    activeRef.current = activeId;
    onSelectRef.current = onSelect;
  });

  // Dock the card on the side away from the active pin so its label stays clear
  const positionCard = () => {
    const map = mapRef.current;
    const card = cardRef.current;
    const current = destinations.find((d) => d.id === activeRef.current);
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

  // Create the map, tiles, home marker and destination pins once
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
      zoomSnap: 0.25,
    });
    mapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
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
      zIndexOffset: 500,
      icon: L.divIcon({
        className: "",
        iconSize: [8, 8],
        iconAnchor: [4, 4],
        html: '<div class="map-home"><span class="ring"></span><span class="core"></span><span class="lbl">YOU ARE HERE · LISBON</span></div>',
      }),
    }).addTo(map);

    // Destination pins with staggered pop-in
    destinations.forEach((destination, index) => {
      const left = destination.dx < 0;
      const icon = L.divIcon({
        className: "",
        iconSize: [10, 10],
        iconAnchor: left ? [10, 5] : [0, 5],
        html: `<div class="map-pin ${left ? "left" : ""}" style="position:absolute;top:0;${left ? "right:0" : "left:0"};animation-delay:${0.15 + index * 0.08}s"><span class="dot"></span><span class="lbl">${destination.mapLabel}</span></div>`,
      });
      markersRef.current[destination.id] = L.marker([destination.lat, destination.lon], { icon, riseOnHover: true })
        .addTo(map)
        .on("click", () => onSelectRef.current(destination.id));
    });

    const reposition = () => positionCardRef.current();
    map.on("move zoom", reposition);
    window.addEventListener("resize", reposition);

    return () => {
      window.removeEventListener("resize", reposition);
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      routeRef.current = null;
    };
  }, [destinations]);

  // Highlight the active pin, dim filtered-out pins and move the card
  useEffect(() => {
    destinations.forEach((destination) => {
      const marker = markersRef.current[destination.id];
      const pin = marker?.getElement()?.querySelector(".map-pin");
      if (!marker || !pin) return;
      const visible = visibleIds.includes(destination.id);
      pin.classList.toggle("on", destination.id === activeId && visible);
      pin.classList.toggle("dim", !visible);
      marker.setZIndexOffset(destination.id === activeId ? 400 : 0);
    });
    positionCardRef.current();
  }, [destinations, visibleIds, activeId]);

  // Load the real driving route for the active destination
  useEffect(() => {
    if (!hasVisible || isInCity(active) || requestedRef.current.has(active.id)) return;
    requestedRef.current.add(active.id);
    fetchDrivingRoute(HOME_LOCATION, active)
      .then((route) => setRoutes((r) => ({ ...r, [active.id]: route })))
      .catch(() => setRoutes((r) => ({ ...r, [active.id]: "failed" })));
  }, [active, hasVisible]);

  // Draw the route line with a drawing animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (routeRef.current) {
      map.removeLayer(routeRef.current);
      routeRef.current = null;
    }
    if (!hasVisible || isInCity(active)) return;

    const real = !!activeRoute && activeRoute !== "failed";
    const points: [number, number][] = real
      ? activeRoute.points
      : [
          [HOME_LOCATION.lat, HOME_LOCATION.lon],
          [active.lat, active.lon],
        ];
    // Straight dashed line until the real driving route loads
    const line = L.polyline(points, {
      color: "#C6A15B",
      weight: real ? 2 : 1.4,
      opacity: 0.85,
      dashArray: real ? undefined : "5 6",
      lineCap: "round",
      lineJoin: "round",
      interactive: false,
    }).addTo(map);
    routeRef.current = line;

    const path = line.getElement() as SVGPathElement | undefined;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.style.animation = "routeDraw 1.1s cubic-bezier(0.22,1,0.36,1) forwards";
    const timer = setTimeout(() => {
      path.style.animation = "";
      path.style.strokeDasharray = real ? "" : "5 6";
      path.style.strokeDashoffset = "0";
    }, 1150);
    return () => clearTimeout(timer);
  }, [active, activeRoute, hasVisible]);

  // Text under the card title
  let routeInfo = "Calculating drive…";
  if (isInCity(active)) routeInfo = "In the city";
  else if (activeRoute === "failed")
    routeInfo = `≈ ${Math.round(distanceInMeters(HOME_LOCATION.lat, HOME_LOCATION.lon, active.lat, active.lon) / 1000)} km from Lisbon (straight line)`;
  else if (activeRoute) routeInfo = formatRoute(activeRoute);

  return (
    <section className="sticky top-[110px]">
      <div ref={containerRef} className="destinations-map h-[clamp(560px,calc(100vh_-_200px),900px)]" />

      {/* Floating detail card */}
      <div
        ref={cardRef}
        className="absolute right-6 bottom-6 z-[1000] w-[280px] overflow-hidden rounded-[2px] bg-[rgba(26,24,18,0.92)] shadow-[0_24px_60px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(198,161,91,0.3)] backdrop-blur-[16px]"
        style={{ display: hasVisible ? "block" : "none" }}
      >
        <DestinationCard key={active.id} destination={active} variant="desktop" routeInfo={routeInfo} />
      </div>
    </section>
  );
}
