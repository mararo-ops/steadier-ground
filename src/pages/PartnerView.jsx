import { useState } from 'react';
import BeaconHero from '../components/BeaconHero';

export default function PartnerView() {
  const [reviewed, setReviewed] = useState(false);

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <BeaconHero title="A moment was flagged" subtitle="Sam · today, 11:42 pm" />

      {!reviewed ? (
        <div className="card">
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', margin: '0 0 10px' }}>flagged content</p>

          <div style={{
            background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)',
            height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <p style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>image preview</p>
          </div>

          <Row label="search term" value="shown exactly as typed" />
          <Row label="site" value="domain shown here" />

          <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', margin: '14px 0 0', lineHeight: 1.5 }}>
            This is only visible to you as Sam's accountability partner. It is not saved on Sam's device.
          </p>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn">Reach out to Sam</button>
            <button className="btn btn-primary" onClick={() => setReviewed(true)}>Mark reviewed</button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 6px' }}>Reviewed and deleted</p>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', margin: 0 }}>
            The image and search term have been permanently removed from our servers.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
      <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: 14, margin: 0 }}>{value}</p>
    </div>
  );
}
