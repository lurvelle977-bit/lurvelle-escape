import type { Metadata } from "next";
import Image from "next/image";
import { VEHICLE_CATEGORIES } from "@/lib/vehicleCategories";
import { DriverForm, VehicleForm } from "@/features/admin/ResourceForms";
import { Panel } from "@/features/admin/ui";
import { requireAdminPage } from "@/server/auth/page";
import { db } from "@/server/db/pool";
import { listDrivers, listVehicles } from "@/server/repositories/resource.repository";

export const metadata: Metadata = { title: "Vehicles & drivers" };

function Thumb({ src, alt, round }: { src: string | null; alt: string; round?: boolean }) {
  const shape = round ? "rounded-full" : "rounded-[4px]";
  if (!src) return <span aria-hidden className={`size-11 shrink-0 border border-cream/14 bg-ink/50 ${shape}`} />;
  return <Image src={src} alt={alt} width={44} height={44} unoptimized className={`size-11 shrink-0 object-cover ${shape}`} />;
}

// Fleet and driver register used by the availability checks on each booking
export default async function ResourcesPage() {
  await requireAdminPage();
  const [vehicles, drivers] = await Promise.all([listVehicles(db), listDrivers(db)]);
  return (
    <>
      <h1 className="font-serif text-[30px] text-cream">Vehicles &amp; drivers</h1>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="grid content-start gap-5">
          <VehicleForm />
          <Panel title={`Vehicles (${vehicles.length})`}>
            {vehicles.length === 0 ? <p className="text-[13px] text-muted">No vehicles yet.</p> : (
              <ul className="grid gap-2 text-[13.5px] text-cream">
                {vehicles.map((vehicle) => (
                  <li key={vehicle.id} className="flex items-center gap-3">
                    <Thumb src={vehicle.imageUrl} alt={vehicle.name} />
                    <span>{vehicle.name} <span className="text-muted">· {VEHICLE_CATEGORIES[vehicle.category]} · {vehicle.plate} · {vehicle.passengerCapacity} seats{vehicle.isActive ? "" : " · inactive"}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <div className="grid content-start gap-5">
          <DriverForm vehicles={vehicles.filter((v) => v.isActive).map(({ id, name, plate }) => ({ id, name, plate }))} />
          <Panel title={`Drivers (${drivers.length})`}>
            {drivers.length === 0 ? <p className="text-[13px] text-muted">No drivers yet.</p> : (
              <ul className="grid gap-2 text-[13.5px] text-cream">
                {drivers.map((driver) => (
                  <li key={driver.id} className="flex items-center gap-3">
                    <Thumb src={driver.imageUrl} alt={driver.name} round />
                    <span>{driver.name} <span className="text-muted">· {driver.phone}{driver.vehicleName ? ` · ${driver.vehicleName}` : ""}{driver.isActive ? "" : " · inactive"}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
