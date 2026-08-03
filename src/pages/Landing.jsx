import { useNavigate } from 'react-router-dom';
import BeaconHero from '../components/BeaconHero';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <BeaconHero
        eyebrow="steadier ground"
        title="A quiet accountability partner for the moments that matter"
        subtitle="Sign up, invite someone you trust, and let them help you find your way back on the nights it's hard."
      />

      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <Feature
          title="Two people, one covenant"
          body="You and your accountability partner both agree to this arrangement before anything is shared."
        />
        <Feature
          title="Flags, not surveillance"
          body="Nothing is watched constantly for its own sake — only moments that cross a line you both understand."
        />
        <Feature
          title="Nothing lingers"
          body="Flagged content goes to your partner and is permanently deleted the moment they've reviewed it."
        />
      </div>

      <button className="btn btn-primary" onClick={() => navigate('/signup')}>
        Get started
      </button>
    </div>
  );
}

function Feature({ title, body }) {
  return (
    <div className="card">
      <p style={{ fontWeight: 500, margin: '0 0 4px', fontSize: 15 }}>{title}</p>
      <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', margin: 0, lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}
