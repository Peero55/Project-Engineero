"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Item = {
  id: string;
  kind: "topic" | "question";
  parent_staging_id: string | null;
  review_status: "pending" | "approved" | "rejected";
  domain_slug: string;
  domain_name: string | null;
  topic_slug: string;
  topic_name: string | null;
  topic_summary: string | null;
  concept_key: string | null;
  variant_index: number;
  difficulty_tier: number;
  question_type: string;
  prompt: string | null;
  short_explanation: string | null;
  long_explanation: string | null;
  reference_link: string | null;
  answer_options: unknown;
  promoted_domain_id: string | null;
  promoted_topic_id: string | null;
  promoted_question_id: string | null;
};

export default function AdminContentIngestDetailPage() {
  const routeParams = useParams<{ ingestId: string }>();
  const ingestId = routeParams?.ingestId ?? null;
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editJson, setEditJson] = useState("");

  const load = useCallback(async () => {
    if (!ingestId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/ingest/${ingestId}`, { credentials: "include" });
      const j = (await res.json().catch(() => null)) as
        | { ingest?: { title: string }; items?: Item[]; error?: string }
        | null;
      if (!res.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      setTitle(j?.ingest?.title ?? "");
      setItems(j?.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
    setLoading(false);
  }, [ingestId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function promote(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/staging/${id}/promote`, {
        method: "POST",
        credentials: "include",
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Promote failed");
    }
    setBusyId(null);
  }

  async function reject(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/staging/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_status: "rejected" }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reject failed");
    }
    setBusyId(null);
  }

  function startEdit(it: Item) {
    setEditId(it.id);
    setEditJson(
      JSON.stringify(
        {
          prompt: it.prompt,
          short_explanation: it.short_explanation,
          long_explanation: it.long_explanation,
          reference_link: it.reference_link,
          difficulty_tier: it.difficulty_tier,
          question_type: it.question_type,
          answer_options: it.answer_options,
          topic_summary: it.topic_summary,
          topic_name: it.topic_name,
          domain_name: it.domain_name,
          domain_slug: it.domain_slug,
          topic_slug: it.topic_slug,
          concept_key: it.concept_key,
        },
        null,
        2
      )
    );
  }

  async function saveEdit() {
    if (!editId) return;
    setBusyId(editId);
    setError(null);
    try {
      const patch = JSON.parse(editJson) as Record<string, unknown>;
      const res = await fetch(`/api/admin/content/staging/${editId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      setEditId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
    setBusyId(null);
  }

  if (!ingestId || loading) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/content" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Content
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-100">Review: {title}</h1>
          <p className="mt-1 font-mono text-[10px] text-zinc-600">{ingestId}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Refresh
        </button>
      </div>

      <p className="mb-4 text-sm text-zinc-400">
        Approve <strong className="text-zinc-200">topic</strong> rows before their questions. New questions are{" "}
        <strong className="text-zinc-200">inactive</strong> until activated on the Questions screen.
      </p>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <ul className="space-y-4">
        {items.map((it) => (
          <li
            key={it.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-medium uppercase text-amber-500/80">
                  {it.kind} · {it.review_status}
                  {it.promoted_question_id ? " · promoted Q" : ""}
                  {it.promoted_topic_id && it.kind === "topic" ? " · promoted T" : ""}
                </p>
                <p className="text-zinc-300">
                  {it.domain_slug} / {it.topic_slug}
                  {it.topic_name ? ` — ${it.topic_name}` : ""}
                </p>
                {it.kind === "topic" && it.topic_summary && (
                  <p className="whitespace-pre-wrap text-xs text-zinc-500">{it.topic_summary}</p>
                )}
                {it.kind === "question" && (
                  <>
                    <p className="text-zinc-200">{it.prompt}</p>
                    <p className="text-xs text-zinc-500">
                      Tier {it.difficulty_tier} · {it.question_type} · concept {it.concept_key} · v
                      {it.variant_index}
                    </p>
                    {it.short_explanation && (
                      <p className="text-xs text-emerald-500/80">Short: {it.short_explanation}</p>
                    )}
                    {it.long_explanation && (
                      <p className="whitespace-pre-wrap text-xs text-zinc-500">
                        Long: {it.long_explanation}
                      </p>
                    )}
                  </>
                )}
                <p className="font-mono text-[10px] text-zinc-600">{it.id}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                {it.review_status === "pending" && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === it.id}
                      onClick={() => void promote(it.id)}
                      className="rounded bg-emerald-900/60 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-900 disabled:opacity-50"
                    >
                      Approve / promote
                    </button>
                    <button
                      type="button"
                      disabled={busyId === it.id}
                      onClick={() => void reject(it.id)}
                      className="rounded border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(it)}
                      className="rounded border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                    >
                      Edit JSON
                    </button>
                  </>
                )}
              </div>
            </div>
            {editId === it.id && (
              <div className="mt-3 border-t border-zinc-800 pt-3">
                <textarea
                  value={editJson}
                  onChange={(e) => setEditJson(e.target.value)}
                  rows={14}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-100"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void saveEdit()}
                    className="rounded bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-900"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="rounded border border-zinc-600 px-3 py-1 text-xs text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
