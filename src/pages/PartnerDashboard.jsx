import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BeaconHero from '../components/BeaconHero';
import { supabase } from '../lib/supabaseClient';

export default function PartnerDashboard() {
  const [name, setName] = useState('');
  const [partnerships, setPartnerships] = useState([]);
  const [pendingFlags, setPendingFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/signup');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', session.user.id)
        .single();
      setName(profile?.first_name || '');

      const { data: partnershipRows } = await supabase
        .from('partnerships')
        .select('id, owner_id, profiles!partnerships_owner_id_fkey(first_name)')
        .eq('partner_user_id', session.user.id)
        .eq('status', 'accepted');

      const partnershipList = partnershipRows || [];
      setPartnerships(partnershipList);

      if (partnershipList.length > 0) {
        const ids = partnershipList.map(p => p.id);
        const { data: flagRows } = await supabase
          .from('flagged_events')
          .select('id, partnership_id, created_at')
          .in('partnership_id', ids)
          .eq('reviewed', false)
          .order('created_at', { ascending: false });

        const withNames = (flagRows || []).map(flag => {
          const partnership = partnershipList.find(p => p.id === flag.partnership_id);
          return { ...flag, ownerName: partnership?.profiles?.first_name || 'Someone' };
        });
        setPendingFlags(withNames);
      }

      setLoading(false);
    };
    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <p style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <BeaconHero
        title={`Good evening, ${name}`}
        subtitle={partnerships.length === 0
          ? "You're not anchoring anyone yet"
          : `Anchoring ${partnerships.length} ${partnerships.length === 1 ? 'person' : 'people'}`}
      />

      {partnerships.length === 0 && (
        <div className="card">
          <p style={{ fontSize: 14, margin: 0 }}>
            When someone invites you as their accountability partner and you accept, they'll show up here.
          </p>
        </div>
      )}

      {pendingFlags.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', margin: '0 0 12px' }}>
            moments awaiting review
          </p>
          {pendingFlags.map(flag => (
            <div
              key={flag.id}
              onClick={() => navigate(`/partner-view/${flag.id}`)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderTop: '1px solid var(--color-border)', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-danger)' }} />
                <p style={{ fontSize: 14, margin: 0 }}>A moment flagged for {flag.ownerName}</p>
              </div>
              <span style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>review →</span>
            </div>
          ))}
        </div>
      )}

      {partnerships.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {partnerships.map(p => {
            const flagCount = pendingFlags.filter(f => f.partnership_id === p.id).length;
            return (
              <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 2px' }}>{p.profiles?.first_name || 'Someone'}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', margin: 0 }}>
                    {flagCount > 0 ? `${flagCount} awaiting review` : 'all quiet'}
                  </p>
                </div>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: flagCount > 0 ? 'var(--color-danger)' : 'var(--color-teal)' }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
