/** Inline SVG mark — no external assets; reads at small and large sizes. */
export function CrestMark({ className = "h-20 w-20 sm:h-24 sm:w-24" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="crest-g" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d97706" />
          <stop offset="0.45" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 52 12v20c0 14-8 22-20 28-12-6-20-14-20-28V12L32 4Z"
        stroke="url(#crest-g)"
        strokeWidth="2"
        fill="rgba(9,9,11,0.6)"
      />
      <path
        d="m32 18-4 8-9 1 7 6-2 9 8-4 8 4-2-9 7-6-9-1-4-8Z"
        fill="url(#crest-g)"
        opacity="0.9"
      />
    </svg>
  );
}
