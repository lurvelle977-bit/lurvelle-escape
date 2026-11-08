"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { adminButton, adminField } from "./ui";

export default function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }
      setError(result?.error?.message ?? "Sign in failed");
    } catch {
      setError("Could not reach the server.");
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div>
        <label htmlFor="admin-email" className="sr-only">Email</label>
        <input id="admin-email" name="email" type="email" required autoComplete="username" placeholder="Email" className={adminField} />
      </div>
      <div>
        <label htmlFor="admin-password" className="sr-only">Password</label>
        <input id="admin-password" name="password" type="password" required autoComplete="current-password" placeholder="Password" className={adminField} />
      </div>
      {error && <p role="alert" className="text-[13px] text-[#e8907f]">{error}</p>}
      <button type="submit" disabled={busy} className={adminButton()}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
