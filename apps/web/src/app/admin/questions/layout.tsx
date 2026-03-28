import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, getAdminApiSecret, verifyAdminCookieValue } from "@/lib/admin-auth";

export default async function AdminQuestionsAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!getAdminApiSecret()) {
    return (
      <div className="rounded-lg border border-amber-900/50 bg-zinc-900/50 p-6">
        <p className="text-sm text-zinc-300">
          Admin is disabled: set <code className="text-amber-200/90">ADMIN_API_SECRET</code> in{" "}
          <code className="text-amber-200/90">.env.local</code> and restart the dev server.
        </p>
      </div>
    );
  }

  const jar = await cookies();
  const raw = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminCookieValue(raw)) {
    redirect("/admin/login?next=/admin/questions");
  }

  return <>{children}</>;
}
