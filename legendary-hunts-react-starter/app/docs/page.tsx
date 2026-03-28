import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';

const files = [
  ['README.md', 'Project overview and run instructions'],
  ['docs/PHASE0_FOUNDATION_LOCK.md', 'Phase 0: loop, combat/defeat, MVP boundaries'],
  ['docs/PROJECT_SYNOPSIS.md', 'Current no-drift project summary'],
  ['docs/PHASE_TASK_LIST.md', 'Authoritative build phases for the agent'],
  ['docs/UI_SYSTEM.md', 'Fantasy UI system and component rules'],
  ['docs/REPO_INDEX.md', 'Dictionary-style file map for the agent'],
  ['prompts/MASTER_AGENT_HANDOFF.md', 'Paste this into the coding agent'],
  ['prompts/CONTENT_GENERATION_PROMPT.md', 'Use this for question import and generation']
];

export default function DocsPage() {
  return (
    <>
      <PageHeader title="Docs" description="This repo is intentionally self-describing so an agent can read it and build without drift." />
      <Panel title="Agent reading order">
        <table className="table">
          <thead>
            <tr><th>File</th><th>Purpose</th></tr>
          </thead>
          <tbody>
            {files.map(([file, purpose]) => (
              <tr key={file}><td>{file}</td><td>{purpose}</td></tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
