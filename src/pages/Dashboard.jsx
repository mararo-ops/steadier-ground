import { useLocation } from 'react-router-dom';
import BeaconHero from '../components/BeaconHero';

export default function Dashboard() {
  const location = useLocation();
  const name = location.state?.name || 'Sam';
  const partnerName = location.state?.partnerName || 'Jordan';

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <BeaconHero
        title={`Good evening, ${name}`}
        subtitle="14 nights guided safely home"
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -8, marginBottom: 20 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-teal)' }} />
        <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>Anchored to {partnerName} · watching quietly</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <StatCard label="status right now" value="Clear waters" iconColor="var(--color-teal)" />
        <StatCard label="current streak" value="14 days" iconColor="var(--color-beacon-ink)" />
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', margin: '0 0 12px' }}>recent activity</p>
        <ActivityRow color="var(--color-teal)" text="Browsing checked in, nothing flagged" time="2 hours ago" />
        <ActivityRow color="var(--color-danger)" text={`A moment was flagged and sent to ${partnerName} for review`} time="yesterday, 11:40 pm" />
        <ActivityRow color="var(--color-ink-muted)" text={`${partnerName} checked in on you`} time="2 days ago" />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn">Message {partnerName}</button>
        <button className="btn">Adjust sensitivity</button>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card">
      <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>{value}</p>
    </div>
  );
}

function ActivityRow({ color, text, time }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '9px 0', borderTop: '1px solid var(--color-border)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, marginTop: 6, flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: 14, margin: 0 }}>{text}</p>
        <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', margin: '2px 0 0' }}>{time}</p>
      </div>
    </div>
  );
}
