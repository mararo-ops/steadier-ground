import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BeaconHero from '../components/BeaconHero';
import { supabase } from '../lib/supabaseClient';

export default function PartnerView() {
  const { eventId } = useParams();
  const [flag, setFlag] = useState(null);
  const [reviewed, setReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      const { data, error: fnError } = await supabase.functions.invoke('get-flag', {
        body: { eventId },
      });
      setLoading(false);
      if (fnError) setError('This moment may already have been reviewed and deleted.');
      else setFlag(data);
    };
    load();
  }, [eventId]);

  const handleMarkReviewed = async () => {
    setLoading(true);
    const { error: fnError } = await supabase.functions.invoke('mark-reviewed', {
      body: { eventId },
    });
    setLoading(false);
    if (fnError) {
      setError('Something went wrong deleting this. It has not been marked reviewed.');
      return;
    }
    setReviewed(true);
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <BeaconHero title="A moment was flagged" subtitle={flag?.createdAt ? new Date(flag.createdAt).toLocaleString() : ''} />

      {loading && <p style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>Loading…</p>}

      {!loading && error && !reviewed && (
        <div className="card">
          <p style={{ fontSize: 14 }}>{error}</p>
        </div>
      )}

      {!loading && !error && !reviewed && flag && (
        <div className="card">
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', margin: '0 0 10px' }}>flagged content</p>

          <img
            src={flag.imageUrl}
            alt="Flagged content"
            style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: 12, display: 'block' }}
          />

          <Row label="search term" value={flag.searchTerm || 'not captured'} />
          <Row label="site" value={flag.domain || 'not captured'} />

          <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', margin: '14px 0 0', lineHeight: 1.5 }}>
            This link and image are only visible to you. Marking this reviewed permanently deletes it.
          </p>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleMarkReviewed} disabled={loading}>
              {loading ? 'Deleting…' : 'Mark reviewed'}
            </button>
          </div>
        </div>
      )}

      {reviewed && (
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
