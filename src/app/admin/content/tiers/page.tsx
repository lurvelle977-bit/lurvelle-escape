import type { Metadata } from "next";
import Link from "next/link";
import { TiersManager } from "@/features/admin/ContentManagers";
import { requireAdminPage } from "@/server/auth/page";
import { db } from "@/server/db/pool";
import { listTiers } from "@/server/repositories/content.repository";

export const metadata: Metadata = { title: "Comfort / pricing tiers" };

export default async function AdminTiersManagerPage() {
  await requireAdminPage();
  const records = await listTiers(db);
  return (
    <>
      <Link href="/admin/content" className="text-[13px] text-sand hover:text-gold">← Content management</Link>
      <h1 className="mt-2 font-serif text-[30px] text-cream">Comfort / pricing tiers</h1>
      <div className="mt-6 max-w-[760px]">
        <TiersManager records={records} />
      </div>
    </>
  );
}
