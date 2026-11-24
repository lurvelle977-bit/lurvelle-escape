import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/features/admin/ui";
import { requireAdminPage } from "@/server/auth/page";

export const metadata: Metadata = { title: "Content management" };

const sections = [
  { href: "/admin/content/experiences", title: "Experiences", text: "The journeys shown on the home page: title, description, price, duration, picture, featured card and order." },
  { href: "/admin/content/destinations", title: "Destinations", text: "The destinations page and map: region, price, duration, coordinates, picture, featured destination and order." },
  { href: "/admin/content/tiers", title: "Comfort / pricing tiers", text: "The three levels of travel on the home page: names, hourly price, features and highlighting." },
];

// Hub for the website content that administrators can edit without a deployment
export default async function ContentPage() {
  await requireAdminPage();
  return (
    <>
      <h1 className="font-serif text-[30px] text-cream">Content management</h1>
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {sections.map((section) => (
          <Panel key={section.href} title={section.title}>
            <p className="text-[13.5px] leading-[1.7] text-sand">{section.text}</p>
            <Link href={section.href} className="mt-4 inline-block text-[13px] text-gold hover:text-gold-light">Manage →</Link>
          </Panel>
        ))}
      </div>
    </>
  );
}
