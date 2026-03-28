import React from 'react';

/**
 * Global screen structure: everything feels embedded in the world, not floating HUD.
 * [ Header ] [ Main panel ] [ Action bar ] [ Feedback layer ]
 */
export function ScreenShell({
  header,
  main,
  actionBar,
  feedback,
}: {
  header: React.ReactNode;
  main: React.ReactNode;
  actionBar?: React.ReactNode;
  feedback?: React.ReactNode;
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
