/**
 * Shared hunts shell: same Penpot token surface as dashboard/codex (.lh-fantasy-ui).
 */
export function HuntShell({
  children,
  maxWidthClass = "max-w-3xl",
}: {
  children: React.ReactNode;
  maxWidthClass?: string;
}) {
  return (
    <div className="lh-fantasy-ui min-h-screen">
      <div className={`relative z-10 mx-auto ${maxWidthClass} px-5 py-12 sm:px-8 sm:py-16`}>
        {children}
      </div>
    </div>
  );
}
