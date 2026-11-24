import type { Metadata } from "next";
import Link from "next/link";
import { DestinationsManager } from "@/features/admin/ContentManagers";
import { requireAdminPage } from "@/server/auth/page";
import { db } from "@/server/db/pool";
import { listDestinations } from "@/server/repositories/content.repository";

export const metadata: Metadata = { title: "Destinations" };

export default async function AdminDestinationsManagerPage() {
  await requireAdminPage();
  const records = await listDestinations(db);
  return (
    <>
      <Link href="/admin/content" className="text-[13px] text-sand hover:text-gold">← Content management</Link>
      <h1 className="mt-2 font-serif text-[30px] text-cream">Destinations</h1>
      <div className="mt-6 max-w-[760px]">
        <DestinationsManager records={records} />
      </div>
    </>
  );
}
