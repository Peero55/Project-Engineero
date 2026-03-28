import { PageHeader } from '@/components/layout/PageHeader';
import { HuntMap, MapNode } from '@/components/game/HuntMap';
import { Panel } from '@/components/ui/Panel';

/** SCREEN 4 — Map (preview layout) */
export default function MapPage() {
  return (
    <>
      <PageHeader
        title="World map"
        description="Zones, paths, and the waiting trial. Locked nodes stay cold stone."
      />
      <HuntMap>
        <div className="hunt-map__row">
          <MapNode type="start" label="Scholar&apos;s Gate" done current />
          <span className="hunt-map__path" aria-hidden />
          <MapNode type="encounter" label="Subnet wilds" done />
          <span className="hunt-map__path" aria-hidden />
          <MapNode type="trial" label="Ports trial" />
          <span className="hunt-map__path hunt-map__path--dashed" aria-hidden />
          <MapNode type="boss" label="Routing leviathan" />
        </div>
      </HuntMap>
      <div style={{ marginTop: 20 }}>
        <Panel variant="dashboard" title="Selected zone" subtitle="Start encounter when Phase 4 wiring lands">
          <p className="muted">Preview only — selection hooks to hunt / encounter APIs in later phases.</p>
        </Panel>
      </div>
    </>
  );
}
