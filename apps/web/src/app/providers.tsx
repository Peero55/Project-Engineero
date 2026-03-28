"use client";

import { DevApiSmokeBanner } from "@/components/dev-api-smoke-banner";
import { SessionIdleGate } from "@/components/session-idle-gate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionIdleGate />
      {children}
      <DevApiSmokeBanner />
    </>
  );
}
