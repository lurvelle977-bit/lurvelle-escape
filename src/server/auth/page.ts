import { redirect } from "next/navigation";
import { getAdmin, type AdminUser } from "./session";

// Guard for admin pages (server components): redirect to the login page when nobody is signed in
export async function requireAdminPage(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
