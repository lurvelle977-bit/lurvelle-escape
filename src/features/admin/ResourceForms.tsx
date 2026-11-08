"use client";

import { adminButton, adminField, Panel } from "./ui";
import { useAdminAction } from "./useAdminAction";

export function VehicleForm() {
  const { run, busy, error, done } = useAdminAction();
  return (
    <Panel title="Add vehicle">
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const element = event.currentTarget;
          const form = new FormData(element);
          const saved = await run("POST", "/api/admin/vehicles", {
            name: form.get("name"),
            vehicleClass: form.get("vehicleClass"),
            plate: form.get("plate"),
            passengerCapacity: Number(form.get("passengerCapacity")),
          }, "Vehicle added");
          if (saved) element.reset();
        }}
      >
        <input name="name" required placeholder="Name, e.g. Mercedes V-Class" aria-label="Name" className={adminField} />
        <input name="vehicleClass" required placeholder="Class, e.g. Business Van" aria-label="Class" className={adminField} />
        <div className="grid grid-cols-2 gap-3">
          <input name="plate" required placeholder="Plate" aria-label="Plate" className={adminField} />
          <input name="passengerCapacity" type="number" min={1} max={60} required placeholder="Seats" aria-label="Passenger capacity" className={adminField} />
        </div>
        <div><button type="submit" disabled={busy} className={adminButton()}>Add vehicle</button></div>
        {error && <p role="alert" className="text-[13px] text-[#e8907f]">{error}</p>}
        {done && !error && <p role="status" className="text-[13px] text-[#8fcf9d]">{done}</p>}
      </form>
    </Panel>
  );
}

export function DriverForm() {
  const { run, busy, error, done } = useAdminAction();
  return (
    <Panel title="Add driver">
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const element = event.currentTarget;
          const form = new FormData(element);
          const email = String(form.get("email") ?? "");
          const saved = await run("POST", "/api/admin/drivers", { name: form.get("name"), phone: form.get("phone"), ...(email ? { email } : {}) }, "Driver added");
          if (saved) element.reset();
        }}
      >
        <input name="name" required placeholder="Name" aria-label="Name" className={adminField} />
        <input name="phone" type="tel" required placeholder="Phone with country code" aria-label="Phone" className={adminField} />
        <input name="email" type="email" placeholder="Email (optional)" aria-label="Email" className={adminField} />
        <div><button type="submit" disabled={busy} className={adminButton()}>Add driver</button></div>
        {error && <p role="alert" className="text-[13px] text-[#e8907f]">{error}</p>}
        {done && !error && <p role="status" className="text-[13px] text-[#8fcf9d]">{done}</p>}
      </form>
    </Panel>
  );
}
