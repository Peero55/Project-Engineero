import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/40 px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
              Home
            </Link>
            <span className="text-sm font-semibold text-amber-500/90">Admin</span>
            <nav className="flex gap-3 text-sm">
              <Link href="/admin/content" className="text-zinc-400 hover:text-zinc-200">
                Content
              </Link>
              <Link href="/admin/questions" className="text-zinc-400 hover:text-zinc-200">
                Questions
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
