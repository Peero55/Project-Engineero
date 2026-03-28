import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { hunts } from '@/lib/data';

export default function HuntsPage() {
  return (
    <>
      <PageHeader title="Hunts" description="Legendary boss paths, mini-boss concept checks, and prep encounters." />
      <div className="grid grid-2">
        {hunts.map((hunt) => (
          <Panel key={hunt.id} title={hunt.title} subtitle={`${hunt.type.toUpperCase()} · ${hunt.domain}`}>
            <p>{hunt.description}</p>
            <ProgressBar value={hunt.progress} />
          </Panel>
        ))}
      </div>
    </>
  );
}
