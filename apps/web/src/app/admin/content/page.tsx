"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const FORMAT_DOC = "docs/CONTENT_INGEST_FORMAT.md (in repo)";

type Cert = { id: string; slug: string; name: string };
type Domain = { id: string; certification_id: string; slug: string; name: string; sort_order: number };
type Ingest = {
  id: string;
  certification_id: string;
  title: string;
  source_kind: string;
  original_filename: string | null;
  parser_version: string;
  plain_text_fallback: boolean;
  created_at: string;
};

export default function AdminContentPage() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [ingests, setIngests] = useState<Ingest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [certId, setCertId] = useState("");
  const [title, setTitle] = useState("");
  const [paste, setPaste] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [fallbackDomainSlug, setFallbackDomainSlug] = useState("");
  const [fallbackDomainName, setFallbackDomainName] = useState("");
  const [fallbackTopicSlug, setFallbackTopicSlug] = useState("");
  const [fallbackTopicName, setFallbackTopicName] = useState("");
  const [variants, setVariants] = useState("2");

  const loadMeta = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/certifications", { credentials: "include" });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { certifications: Cert[]; domains: Domain[] };
      setCerts(j.certifications);
      setDomains(j.domains);
      if (j.certifications.length && !certId) {
        setCertId(j.certifications[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load certifications");
    }
  }, [certId]);

  const loadIngests = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/content/ingests", { credentials: "include" });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { ingests: Ingest[] };
      setIngests(j.ingests);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ingests");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      await loadMeta();
      await loadIngests();
      setLoading(false);
    })();
  }, [loadMeta, loadIngests]);

  useEffect(() => {
    if (!certId || domains.length === 0) return;
    const d0 = domains.find((d) => d.certification_id === certId);
    if (d0) {
      setFallbackDomainSlug((s) => s || d0.slug);
      setFallbackDomainName((n) => n || d0.name);
    }
  }, [certId, domains]);

  async function submitIngest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("certificationId", certId);
      fd.set("title", title.trim() || "Untitled ingest");
      if (file) fd.set("file", file);
      else fd.set("text", paste);
      if (useFallback) {
        fd.set(
          "plainTextFallback",
          JSON.stringify({
            domainSlug: fallbackDomainSlug,
            domainName: fallbackDomainName,
            topicSlug: fallbackTopicSlug,
            topicName: fallbackTopicName,
          })
        );
      }
      if (variants.trim()) fd.set("variantsPerConcept", variants.trim());

      const res = await fetch("/api/admin/content/ingest", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json().catch(() => null)) as
        | { ingestId?: string; error?: string; usedStructuredOutline?: boolean; itemCount?: number }
        | null;
      if (!res.ok) {
        throw new Error(j?.error ?? `HTTP ${res.status}`);
      }
      setTitle("");
      setPaste("");
      setFile(null);
      await loadIngests();
      if (j?.ingestId) {
        window.location.href = `/admin/content/${j.ingestId}`;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ingest failed");
    }
    setBusy(false);
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Content ingestion</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload PDF/text, parse into structured staging rows, then approve topics before questions.
          Format reference: {FORMAT_DOC}.
        </p>
      </div>

      <form
        onSubmit={(e) => void submitIngest(e)}
        className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
      >
        <p className="text-sm font-medium text-zinc-300">New ingest</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-zinc-500">
            Certification
            <select
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            >
              {certs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-zinc-500">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              placeholder="e.g. ACME Study Guide ch.3"
            />
          </label>
        </div>

        <label className="mt-3 block text-xs text-zinc-500">
          Paste text (or leave empty and choose a file)
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={6}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100"
            placeholder="# domain: slug | Name&#10;## topic: slug | Name&#10;…"
          />
        </label>

        <label className="mt-3 block text-xs text-zinc-500">
          Or file (.pdf, .txt)
          <input
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-zinc-400"
          />
        </label>

        <div className="mt-4 rounded border border-zinc-800 p-3">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={useFallback}
              onChange={(e) => setUseFallback(e.target.checked)}
            />
            Plain-text fallback (single topic + heuristic questions if no structured headings)
          </label>
          {useFallback && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input
                value={fallbackDomainSlug}
                onChange={(e) => setFallbackDomainSlug(e.target.value)}
                placeholder="domain slug"
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
              />
              <input
                value={fallbackDomainName}
                onChange={(e) => setFallbackDomainName(e.target.value)}
                placeholder="domain display name"
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
              />
              <input
                value={fallbackTopicSlug}
                onChange={(e) => setFallbackTopicSlug(e.target.value)}
                placeholder="topic slug"
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
              />
              <input
                value={fallbackTopicName}
                onChange={(e) => setFallbackTopicName(e.target.value)}
                placeholder="topic display name"
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
              />
              <label className="sm:col-span-2 flex items-center gap-2 text-xs text-zinc-500">
                Variants per concept
                <input
                  value={variants}
                  onChange={(e) => setVariants(e.target.value)}
                  className="w-16 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-100"
                />
              </label>
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy || (!file && !paste.trim())}
          className="mt-4 rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
        >
          {busy ? "Ingesting…" : "Run ingest"}
        </button>
      </form>

      <h2 className="mt-10 text-lg font-medium text-zinc-200">Recent ingests</h2>
      <ul className="mt-3 space-y-2">
        {ingests.map((ing) => (
          <li key={ing.id}>
            <Link
              href={`/admin/content/${ing.id}`}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm hover:border-zinc-600"
            >
              <span className="text-zinc-200">{ing.title}</span>
              <span className="font-mono text-[10px] text-zinc-500">
                {ing.source_kind}
                {ing.plain_text_fallback ? " · fallback" : ""} · {new Date(ing.created_at).toLocaleString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {ingests.length === 0 && <p className="mt-2 text-sm text-zinc-500">No ingests yet.</p>}
    </div>
  );
}
