"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { VEHICLE_CATEGORIES } from "@/lib/vehicleCategories";
import { BOOKING_STATUSES } from "@/server/domain/status";
import { adminButton, adminField } from "./ui";

const KEYS = ["q", "status", "type", "category", "assignment", "dates", "from", "to"] as const;
type Key = (typeof KEYS)[number];

// Filter bar for the bookings table. The filters live in the URL, so the server page re-queries PostgreSQL
// on every change; any change drops "page" so results start from page 1.
export default function BookingFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const get = (key: Key) => params.get(key) ?? "";
  const [search, setSearch] = useState(get("q"));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keep the search box in step with the URL (back/forward navigation, Clear filters)
  useEffect(() => setSearch(params.get("q") ?? ""), [params]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const apply = (changes: Partial<Record<Key, string>>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    const query = next.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname));
  };

  const onSearch = (value: string) => {
    setSearch(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => apply({ q: value.trim() }), 300);
  };

  const dates = get("dates");
  const active = KEYS.filter((key) => get(key) !== "").length;
  const select = (key: Key, label: string, options: [string, string][]) => (
    <>
      <label className="sr-only" htmlFor={`f-${key}`}>{label}</label>
      <select id={`f-${key}`} value={get(key)} onChange={(event) => apply(key === "dates" ? { dates: event.target.value, from: "", to: "" } : { [key]: event.target.value })} className={adminField}>
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </>
  );

  return (
    <div className="mt-6 grid gap-3" aria-busy={pending}>
      <div className="grid gap-3 md:grid-cols-[1fr_200px_180px]">
        <div>
          <label className="sr-only" htmlFor="f-q">Search bookings</label>
          <input id="f-q" type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search reference, customer, email, phone or destination" maxLength={100} className={adminField} />
        </div>
        <div>
          {select("status", "Status", [["", "All statuses"], ...BOOKING_STATUSES.map((status): [string, string] => [status, status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())])])}
        </div>
        <div>{select("type", "Booking type", [["", "All booking types"], ["TOUR_PACKAGE", "Tour package"], ["VEHICLE_RIDE", "Vehicle / ride"]])}</div>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
        <div>{select("category", "Vehicle category", [["", "All categories"], ...(Object.entries(VEHICLE_CATEGORIES) as [string, string][])])}</div>
        <div>{select("assignment", "Vehicle assignment", [["", "All assignments"], ["assigned", "Assigned"], ["unassigned", "Not assigned"]])}</div>
        <div>
          {select("dates", "Travel date", [["", "All dates"], ["today", "Today"], ["upcoming", "Upcoming"], ["past", "Past"], ["range", "Custom date range"]])}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" disabled={active === 0} onClick={() => { clearTimeout(timer.current); setSearch(""); startTransition(() => router.replace(pathname)); }} className={adminButton("plain")}>
            Clear filters{active > 0 ? ` (${active})` : ""}
          </button>
          {pending && <span role="status" className="text-[12px] text-muted">Updating…</span>}
        </div>
      </div>
      {dates === "range" && (
        <div className="grid gap-3 sm:grid-cols-2 md:max-w-[460px]">
          <div>
            <label className="mb-1 block text-[11px] tracking-[1.2px] text-muted uppercase" htmlFor="f-from">Travel from</label>
            <input id="f-from" type="date" value={get("from")} max={get("to") || undefined} onChange={(event) => apply({ from: event.target.value })} className={adminField} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] tracking-[1.2px] text-muted uppercase" htmlFor="f-to">Travel to</label>
            <input id="f-to" type="date" value={get("to")} min={get("from") || undefined} onChange={(event) => apply({ to: event.target.value })} className={adminField} />
          </div>
        </div>
      )}
    </div>
  );
}
