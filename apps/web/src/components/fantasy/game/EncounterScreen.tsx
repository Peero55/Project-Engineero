import type { ReactNode } from "react";
import { ScreenShell } from "@/components/fantasy/layout/ScreenShell";
import { Panel } from "@/components/fantasy/ui/Panel";

/**
 * Full battle layout: identity header, optional duel row (enemy vs player vitals), battle panel body, strike bar, feedback.
 */
export function EncounterScreen({
  header,
  duelRow,
  panelTitle,
  panelSubtitle,
  panelGlow = true,
  children,
  actionBar,
  feedback,
}: {
  header: ReactNode;
  duelRow?: ReactNode;
  panelTitle?: string;
  panelSubtitle?: string;
  panelGlow?: boolean;
  children: ReactNode;
  actionBar?: ReactNode;
  feedback?: ReactNode;
}) {
  return (
    <ScreenShell
      header={header}
      main={
        <>
          {duelRow ? <div className="encounter-duel">{duelRow}</div> : null}
          <Panel variant="battle" title={panelTitle} subtitle={panelSubtitle} glow={panelGlow}>
            <div className="encounter-main">{children}</div>
          </Panel>
        </>
      }
      actionBar={actionBar}
      feedback={feedback}
    />
  );
}
