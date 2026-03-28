"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function AdminLoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const nextPath = sp.get("next") || "/admin/questions";
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? `HTTP ${res.status}`);
        setLoading(false);
        return;
      }
      router.push(nextPath.startsWith("/admin") ? nextPath : "/admin/questions");
      router.refresh();
    } catch {
      setError("Request failed");
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold text-zinc-100">Admin sign-in</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Enter the <code className="text-zinc-300">ADMIN_API_SECRET</code> from your environment.
        Session lasts 8 hours (httpOnly cookie).
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm text-zinc-400">
          Secret
          <input
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !secret}
          className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
      <AdminLoginForm />
    </Suspense>
  );
}
