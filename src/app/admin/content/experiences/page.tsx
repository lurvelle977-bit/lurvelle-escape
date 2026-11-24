import type { Metadata } from "next";
import Link from "next/link";
import { ExperiencesManager } from "@/features/admin/ContentManagers";
import { requireAdminPage } from "@/server/auth/page";
import { db } from "@/server/db/pool";
import { listExperiences } from "@/server/repositories/content.repository";

export const metadata: Metadata = { title: "Experiences" };

export default async function AdminExperiencesManagerPage() {
  await requireAdminPage();
  const records = await listExperiences(db);
  return (
    <>
      <Link href="/admin/content" className="text-[13px] text-sand hover:text-gold">← Content management</Link>
      <h1 className="mt-2 font-serif text-[30px] text-cream">Experiences</h1>
      <div className="mt-6 max-w-[760px]">
        <ExperiencesManager records={records} />
      </div>
    </>
  );
}
