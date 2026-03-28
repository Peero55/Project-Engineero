"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  prompt: string;
  difficulty_tier: number;
  is_active: boolean;
  question_type: string;
  source_type: string;
  topic_id: string;
  certification_id: string;
  created_at: string;
  topic_name: string | null;
  topic_slug: string | null;
};

export default function AdminQuestionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: "100", offset: "0" });
    if (filter === "active") params.set("active_only", "true");
    if (filter === "inactive") params.set("active_only", "false");
    if (q.trim()) params.set("q", q.trim());
    try {
      const res = await fetch(`/api/admin/questions?${params}`, { credentials: "include" });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? `HTTP ${res.status}`);
        setRows([]);
        setTotal(0);
        return;
      }
      const j = (await res.json()) as { questions: Row[]; total: number };
      setRows(j.questions);
      setTotal(j.total);
    } catch {
      setError("Failed to load");
      setRows([]);
    }
    setLoading(false);
  }, [filter, q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE", credentials: "include" });
    window.location.href = "/admin/login";
  }

  async function toggleActive(id: string, next: boolean) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? `HTTP ${res.status}`);
        setBusyId(null);
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: next } : r)));
    } catch {
      setError("Update failed");
    }
    setBusyId(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Question review</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Activate or deactivate items before players see them. Tier 5 (labs) should stay out of
            normal battles per design.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="all">All</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <input
          type="search"
          placeholder="Search prompt…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[200px] flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded bg-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
        >
          Refresh
        </button>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Showing {rows.length} of {total} matching
      </p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="mt-8 text-sm text-zinc-500">Loading…</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-200">{r.prompt}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Tier {r.difficulty_tier} · {r.question_type} · {r.source_type}
                    {r.topic_name ? ` · ${r.topic_name}` : ""}
                    {r.topic_slug ? ` (${r.topic_slug})` : ""}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-zinc-600">{r.id}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={
                      r.is_active ? "text-xs font-medium text-emerald-400" : "text-xs text-zinc-500"
                    }
                  >
                    {r.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => void toggleActive(r.id, !r.is_active)}
                    className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {r.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
