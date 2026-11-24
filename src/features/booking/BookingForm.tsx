"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { buttonClasses } from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";
import { VEHICLE_CATEGORIES, type VehicleCategory } from "@/lib/vehicleCategories";
import { fieldClasses } from "@/features/contact/ContactForm";

type Destination = { id: string; name: string };

type FormData = {
  bookingType: "" | "tour" | "vehicle";
  vehicleCategory: "" | VehicleCategory;
  destinationType: "" | "catalog" | "custom";
  destination: string;
  customDestination: string;
  travelDate: string;
  pickupLocation: string;
  passengers: number;
  notes: string;
  name: string;
  email: string;
  whatsapp: string;
};

const initialData: FormData = {
  bookingType: "",
  vehicleCategory: "",
  destinationType: "",
  destination: "",
  customDestination: "",
  travelDate: "",
  pickupLocation: "",
  passengers: 1,
  notes: "",
  name: "",
  email: "",
  whatsapp: "",
};

type FieldErrors = Partial<Record<string, string[]>>;

const choiceClasses = (active: boolean) =>
  cn(
    "cursor-pointer rounded-[4px] border px-4 py-[14px] text-center text-[13px] transition-colors duration-300",
    active ? "border-gold bg-gold/12 text-cream" : "border-cream/20 text-sand hover:border-gold/60",
  );

function Field({ id, label, error, children }: { id: string; label: string; error?: string[]; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {children}
      {error?.[0] && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[12px] text-[#e8907f]">
          {error[0]}
        </p>
      )}
    </div>
  );
}

// Booking request form: choose a service and destination, then trip and contact details, review, and submit.
export default function BookingForm({
  destinations,
  initialDestination,
  vehicleCategories,
}: {
  destinations: Destination[];
  initialDestination?: string;
  vehicleCategories: VehicleCategory[];
}) {
  const router = useRouter();
  const preset = destinations.some((entry) => entry.id === initialDestination) ? initialDestination! : "";
  const [data, setData] = useState<FormData>({ ...initialData, destinationType: preset ? "catalog" : "", destination: preset });
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  // One key per form visit lets the server ignore accidental double submissions
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const today = new Date().toISOString().slice(0, 10);
  const destinationName = destinations.find((entry) => entry.id === data.destination)?.name;

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => setData((previous) => ({ ...previous, [key]: value }));
  const onText = (key: keyof FormData) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    set(key, event.target.value as never);
  const aria = (name: string) => (errors[name] ? { "aria-invalid": true, "aria-describedby": `booking-${name}-error` } : {});

  const handleReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!data.bookingType) return setErrors({ bookingType: ["Choose a service"] });
    if (data.bookingType === "vehicle" && !data.vehicleCategory) return setErrors({ vehicleCategory: ["Choose a vehicle category"] });
    if (!data.destinationType) return setErrors({ destinationType: ["Choose how you would like to pick your destination"] });
    setErrors({});
    setStep("review");
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, idempotencyKey }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.ok) {
        const params = new URLSearchParams({ ref: result.data.reference, t: new URL(result.data.trackingPath, location.origin).searchParams.get("t") ?? "" });
        // Stay in the submitting state while navigating so the button cannot be pressed twice
        router.push(`/book/success?${params}`);
        return;
      }
      if (result?.error?.details) {
        setErrors(result.error.details);
        setStep("edit");
      }
      setFormError(result?.error?.message ?? "We could not send your request. Please try again.");
    } catch {
      setFormError("We could not reach the server. Check your connection and try again.");
    }
    setSubmitting(false);
  };

  const formClasses = "md:rounded-md md:bg-charcoal/65 md:px-7 md:pt-8 md:pb-7 md:shadow-form lg:px-11 lg:pt-11 lg:pb-10";

  if (step === "review") {
    const rows: [string, string][] = [
      ["Service", data.bookingType === "tour" ? "Tour package" : "Vehicle / ride"],
      ...(data.bookingType === "vehicle" && data.vehicleCategory ? ([["Vehicle category", VEHICLE_CATEGORIES[data.vehicleCategory]]] as [string, string][]) : []),
      ["Destination", data.destinationType === "catalog" ? (destinationName ?? "") : data.customDestination],
      ["Travel date", data.travelDate],
      ["Pickup", data.pickupLocation],
      ["Passengers", String(data.passengers)],
      ["Notes", data.notes || "—"],
      ["Name", data.name],
      ["Email", data.email],
      ["WhatsApp", data.whatsapp],
    ];
    return (
      <div className={formClasses}>
        <Eyebrow>Review your request</Eyebrow>
        <dl className="mt-6 grid gap-4">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[110px_1fr] gap-3 border-b border-cream/10 pb-3 text-[14px]">
              <dt className="text-muted">{label}</dt>
              <dd className="break-words whitespace-pre-line text-cream">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-[13px] leading-[1.7] text-muted">
          This sends a request for review — it is not a confirmed booking. We will contact you about availability and pricing.
        </p>
        {formError && (
          <p role="alert" className="mt-4 text-[13px] text-[#e8907f]">
            {formError}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" disabled={submitting} onClick={() => setStep("edit")} className={buttonClasses("light", "px-8 py-[15px] disabled:opacity-50")}>
            Edit details
          </button>
          <button type="button" disabled={submitting} onClick={handleSubmit} className={buttonClasses("gold", "px-8 py-[15px] disabled:cursor-wait disabled:opacity-60")}>
            {submitting ? "Sending…" : "Send booking request"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleReview} noValidate={false} className={formClasses}>
      <div className="flex flex-col gap-[26px] md:gap-[18px]">
        <fieldset>
          <legend className="sr-only">Service</legend>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" aria-pressed={data.bookingType === "tour"} onClick={() => setData((previous) => ({ ...previous, bookingType: "tour", vehicleCategory: "" }))} className={choiceClasses(data.bookingType === "tour")}>
              Tour package
            </button>
            <button type="button" aria-pressed={data.bookingType === "vehicle"} onClick={() => set("bookingType", "vehicle")} className={choiceClasses(data.bookingType === "vehicle")}>
              Vehicle / ride
            </button>
          </div>
          {errors.bookingType && <p role="alert" className="mt-1.5 text-[12px] text-[#e8907f]">{errors.bookingType[0]}</p>}
        </fieldset>

        {data.bookingType === "vehicle" && (
          <Field id="booking-vehicleCategory" label="Vehicle category" error={errors.vehicleCategory}>
            <select id="booking-vehicleCategory" required value={data.vehicleCategory} onChange={onText("vehicleCategory")} className={cn(fieldClasses, "appearance-none")} {...aria("vehicleCategory")}>
              <option value="" className="bg-charcoal">Choose a vehicle</option>
              {vehicleCategories.map((key) => (
                <option key={key} value={key} className="bg-charcoal">
                  {VEHICLE_CATEGORIES[key]}
                </option>
              ))}
            </select>
          </Field>
        )}

        <fieldset>
          <legend className="sr-only">Destination</legend>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" aria-pressed={data.destinationType === "catalog"} onClick={() => set("destinationType", "catalog")} className={choiceClasses(data.destinationType === "catalog")}>
              From our destinations
            </button>
            <button type="button" aria-pressed={data.destinationType === "custom"} onClick={() => set("destinationType", "custom")} className={choiceClasses(data.destinationType === "custom")}>
              Custom destination
            </button>
          </div>
          {errors.destinationType && <p role="alert" className="mt-1.5 text-[12px] text-[#e8907f]">{errors.destinationType[0]}</p>}
        </fieldset>

        {data.destinationType === "catalog" && (
          <Field id="booking-destination" label="Destination" error={errors.destination}>
            <select id="booking-destination" required value={data.destination} onChange={onText("destination")} className={cn(fieldClasses, "appearance-none")} {...aria("destination")}>
              <option value="" className="bg-charcoal">Choose a destination</option>
              {destinations.map((entry) => (
                <option key={entry.id} value={entry.id} className="bg-charcoal">
                  {entry.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        {data.destinationType === "custom" && (
          <Field id="booking-customDestination" label="Describe your destination" error={errors.customDestination}>
            <textarea
              id="booking-customDestination"
              required
              rows={3}
              maxLength={500}
              placeholder="Where would you like to go?"
              value={data.customDestination}
              onChange={onText("customDestination")}
              className={cn(fieldClasses, "block resize-none")}
              {...aria("customDestination")}
            />
          </Field>
        )}

        <div className="grid gap-[26px] md:grid-cols-2 md:gap-[18px]">
          <Field id="booking-travelDate" label="Travel date" error={errors.travelDate}>
            <input id="booking-travelDate" type="date" required min={today} value={data.travelDate} onChange={onText("travelDate")} className={cn(fieldClasses, "scheme-dark")} {...aria("travelDate")} />
          </Field>
          <Field id="booking-passengers" label="Number of passengers" error={errors.passengers}>
            <input
              id="booking-passengers"
              type="number"
              required
              min={1}
              max={60}
              inputMode="numeric"
              placeholder="Passengers"
              value={data.passengers}
              onChange={(event) => set("passengers", Number(event.target.value))}
              className={fieldClasses}
              {...aria("passengers")}
            />
          </Field>
        </div>

        <Field id="booking-pickupLocation" label="Pickup location" error={errors.pickupLocation}>
          <input id="booking-pickupLocation" type="text" required maxLength={300} placeholder="Pickup location" value={data.pickupLocation} onChange={onText("pickupLocation")} className={fieldClasses} {...aria("pickupLocation")} />
        </Field>

        <Field id="booking-name" label="Your name" error={errors.name}>
          <input id="booking-name" type="text" required autoComplete="name" placeholder="Your name" value={data.name} onChange={onText("name")} className={fieldClasses} {...aria("name")} />
        </Field>
        <div className="grid gap-[26px] md:grid-cols-2 md:gap-[18px]">
          <Field id="booking-email" label="Your email" error={errors.email}>
            <input id="booking-email" type="email" required autoComplete="email" placeholder="Your email" value={data.email} onChange={onText("email")} className={fieldClasses} {...aria("email")} />
          </Field>
          <Field id="booking-whatsapp" label="WhatsApp number" error={errors.whatsapp}>
            <input id="booking-whatsapp" type="tel" required autoComplete="tel" placeholder="WhatsApp, e.g. +351 912 345 678" value={data.whatsapp} onChange={onText("whatsapp")} className={fieldClasses} {...aria("whatsapp")} />
          </Field>
        </div>

        <Field id="booking-notes" label="Additional notes" error={errors.notes}>
          <textarea id="booking-notes" rows={3} maxLength={2000} placeholder="Anything we should know? (optional)" value={data.notes} onChange={onText("notes")} className={cn(fieldClasses, "block resize-none")} {...aria("notes")} />
        </Field>

        {formError && (
          <p role="alert" className="text-[13px] text-[#e8907f]">
            {formError}
          </p>
        )}

        <button type="submit" className={buttonClasses("gold", "mt-2 px-9 py-[17px] md:mt-1.5 md:rounded-[4px] md:py-[18px] md:font-bold md:tracking-[2px]")}>
          Review request
        </button>
      </div>
    </form>
  );
}
