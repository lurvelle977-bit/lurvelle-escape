import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/config/site";
import LogoutButton from "@/features/admin/LogoutButton";
import { getAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: { default: "Admin", template: `%s — ${SITE_NAME} admin` }, robots: { index: false, follow: false } };

// Admin area shell: simple header on the site's dark theme. Pages enforce their own sign-in check.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b border-cream/10">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-6 py-4">
          <nav aria-label="Admin" className="flex items-center gap-6 text-[13px]">
            <Link href="/admin" className="font-serif text-[18px] text-cream hover:text-gold">{SITE_NAME}</Link>
            {admin && (
              <>
                <Link href="/admin" className="text-sand hover:text-gold">Bookings</Link>
                <Link href="/admin/resources" className="text-sand hover:text-gold">Vehicles &amp; drivers</Link>
              </>
            )}
          </nav>
          {admin && (
            <div className="flex items-center gap-4 text-[13px] text-muted">
              <span>{admin.name}</span>
              <LogoutButton />
            </div>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-[1240px] px-6 py-8">{children}</div>
    </div>
  );
}
