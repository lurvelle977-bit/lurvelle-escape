"use client";

import { useRouter } from "next/navigation";
import { adminButton } from "./ui";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className={adminButton("plain")}
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
        router.push("/admin/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
