import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BeaconHero from '../components/BeaconHero';
import { supabase } from '../lib/supabaseClient';

export default function AcceptInvite() {
  const { partnershipId } = useParams();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error: fnError } = await supabase.functions.invoke('get-invite', {
        body: { partnershipId },
      });
      setLoading(false);
      if (fnError) {
        setError('This invite link is invalid or has expired.');
        return;
      }
      setInvite(data);
      setName(data.partnerName || '');
      if (data.status === 'accepted') setAccepted(true);
    };
    load();
  }, [partnershipId]);

  // Resume after clicking the email confirmation link
  useEffect(() => {
    const resume = async () => {
      const pending = localStorage.getItem('sg_pending_accept');
      if (!pending || pending !== partnershipId) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        localStorage.removeItem('sg_pending_accept');
        await finalizeAcceptance();
      }
    };
    resume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnershipId]);

  const finalizeAcceptance = async () => {
    const { error: acceptError } = await supabase.functions.invoke('accept-invite', {
      body: { partnershipId },
    });
    if (acceptError) {
      setError(acceptError.message || 'Could not link this account to the invite.');
      return;
    }
    setAccepted(true);
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: invite.partnerEmail,
        password,
        options: {
          data: { first_name: name },
          emailRedirectTo: `${window.location.origin}/accept-invite/${partnershipId}`,
        },
      });
      setSubmitting(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session) {
        await finalizeAcceptance();
      } else {
        localStorage.setItem('sg_pending_accept', partnershipId);
        setAwaitingConfirmation(true);
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invite.partnerEmail,
        password,
      });
      setSubmitting(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      await finalizeAcceptance();
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <p style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>Loading…</p>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <BeaconHero title="This link isn't working" subtitle="It may be outdated" />
        <div className="card">
          <p style={{ fontSize: 14 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <BeaconHero title="You're connected" subtitle={`Anchored to ${invite?.ownerName || 'them'}`} />
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 6px' }}>You're all set</p>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', margin: '0 0 16px' }}>
            You'll get an email whenever there's something for you to review.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/partner-dashboard'}>
            Go to your dashboard
          </button>
        </div>
      </div>
    );
  }

  if (awaitingConfirmation) {
    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <BeaconHero title="Check your email" subtitle="Confirm your account to finish connecting" />
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 6px' }}>We sent a confirmation link to {invite.partnerEmail}</p>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', margin: 0 }}>
            Click it on this device and you'll be connected automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <BeaconHero title={`${invite.ownerName} invited you`} subtitle="to be their accountability partner" />

      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 16, fontWeight: 500, margin: '0 0 14px' }}>What this role involves</p>
        <Row text={`You may occasionally receive a flagged image and search term, sent only to you`} />
        <Row text="It's permanently deleted from the server the moment you mark it reviewed" />
        <Row text={`You'll also be told if ${invite.ownerName} turns off protection or removes the app`} />

        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 16 }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 3 }} />
          <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
            I understand this role and agree to take it on for {invite.ownerName}.
          </span>
        </label>
      </div>

      {agreed && (
        <div className="card">
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', margin: '0 0 4px' }}>
            {mode === 'signup' ? 'create your account' : 'log in'}
          </p>

          {mode === 'signup' && (
            <div className="field">
              <label>Your name</label>
              <input value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input value={invite.partnerEmail} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="field">
            <label>{mode === 'signup' ? 'Choose a password' : 'Password'}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button
            className="btn btn-primary"
            disabled={submitting || password.length < 6 || (mode === 'signup' && !name)}
            onClick={handleSubmit}
          >
            {submitting ? 'Working…' : mode === 'signup' ? 'Accept and continue' : 'Log in and accept'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', textAlign: 'center', margin: '12px 0 0' }}>
            {mode === 'signup' ? (
              <>Already have an account? <a href="#" onClick={e => { e.preventDefault(); setMode('login'); }}>Log in instead</a></>
            ) : (
              <>New here? <a href="#" onClick={e => { e.preventDefault(); setMode('signup'); }}>Create an account</a></>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ text }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
      <span style={{ color: 'var(--color-teal)', fontSize: 14, fontWeight: 600, width: 16 }}>✓</span>
      <p style={{ fontSize: 13, margin: 0 }}>{text}</p>
    </div>
  );
}
