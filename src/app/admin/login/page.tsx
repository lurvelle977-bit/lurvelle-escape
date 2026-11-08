import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/features/admin/LoginForm";
import { getAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="mx-auto mt-16 max-w-[380px] rounded-md bg-charcoal/65 p-8 shadow-form">
      <h1 className="mb-6 font-serif text-[26px] text-cream">Admin sign in</h1>
      <LoginForm />
    </div>
  );
}
