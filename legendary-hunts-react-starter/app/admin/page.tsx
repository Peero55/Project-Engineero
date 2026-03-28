import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';

export default function AdminPage() {
  return (
    <>
      <PageHeader title="Admin" description="Full admin is in scope, but build questions/imports first." />
      <Panel title="Admin priorities" subtitle="This is the minimum no-drift order.">
        <ol>
          <li>Question list + edit screen</li>
          <li>CSV / DOCX / PDF import jobs</li>
          <li>Review and publish states</li>
          <li>User and team summaries</li>
          <li>Events and badge controls</li>
        </ol>
      </Panel>
    </>
  );
}
