import type { ReactNode } from "react";

/**
 * Global encounter structure: header, main panel, optional action bar, feedback strip.
 */
export function ScreenShell({
  header,
  main,
  actionBar,
  feedback,
}: {
  header: ReactNode;
  main: ReactNode;
  actionBar?: ReactNode;
  feedback?: ReactNode;
}) {
  return (
    <div className="screen-shell">
      <div className="screen-shell__header">{header}</div>
      <div className="screen-shell__main">{main}</div>
      {actionBar ? <div className="screen-shell__action">{actionBar}</div> : null}
      {feedback ? <div className="screen-shell__feedback">{feedback}</div> : null}
    </div>
  );
}
