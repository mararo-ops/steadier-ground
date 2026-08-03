import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BeaconHero from '../components/BeaconHero';
import { supabase } from '../lib/supabaseClient';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', ageConfirmed: false,
    partnerName: '', partnerEmail: '',
    consentSelf: false, consentPartner: false,
  });
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const navigate = useNavigate();

  // If the user is arriving back after clicking the confirmation link,
  // resume exactly where they left off instead of starting over.
  useEffect(() => {
    const resume = async () => {
      const pending = localStorage.getItem('sg_pending_signup');
      if (!pending) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const saved = JSON.parse(pending);
        setForm(f => ({ ...f, name: saved.name, partnerName: saved.partnerName, partnerEmail: saved.partnerEmail }));
        setUserId(session.user.id);
        setAwaitingConfirmation(false);
        setStep(saved.partnerName ? 3 : 2);
        localStorage.removeItem('sg_pending_signup');
      }
    };
    resume();
  }, []);

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const canContinueStep1 = form.name && form.email && form.password.length >= 8 && form.ageConfirmed;
  const canContinueStep2 = form.partnerName && form.partnerEmail;
  const canFinish = form.consentSelf && form.consentPartner;

  const handleCreateAccount = async () => {
    setError('');
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { first_name: form.name, age_confirmed: form.ageConfirmed },
        emailRedirectTo: `${window.location.origin}/signup`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    if (data.session) {
      setUserId(data.user.id);
      setStep(2);
    } else {
      localStorage.setItem('sg_pending_signup', JSON.stringify({ name: form.name }));
      setAwaitingConfirmation(true);
    }
  };

  const handleSendInvite = async () => {
    setError('');
    setLoading(true);

    const { data: partnership, error: partnershipError } = await supabase
      .from('partnerships')
      .insert({
        owner_id: userId,
        partner_name: form.partnerName,
        partner_email: form.partnerEmail,
        consent_self: form.consentSelf,
        consent_partner: form.consentPartner,
      })
      .select()
      .single();

    if (partnershipError) {
      setError(partnershipError.message);
      setLoading(false);
      return;
    }

    const { error: inviteError } = await supabase.functions.invoke('send-invite', {
      body: {
        ownerName: form.name,
        partnerName: form.partnerName,
        partnerEmail: form.partnerEmail,
        partnershipId: partnership.id,
      },
    });

    setLoading(false);
    if (inviteError) {
      setError(`Account created, but the invite email failed to send: ${inviteError.message}`);
      return;
    }

    navigate('/dashboard', { state: { name: form.name, partnerName: form.partnerName } });
  };

  if (awaitingConfirmation) {
    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <BeaconHero title="Check your email" subtitle="Confirm your account to continue" />
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 6px' }}>We sent a confirmation link to {form.email}</p>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', margin: 0 }}>
            Click the link in that email on this device to come right back here and continue inviting your partner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <BeaconHero
        title="Find steadier ground"
        subtitle="A quiet accountability partner for the moments that matter"
      />

      <StepDots step={step} />

      {step === 1 && (
        <div className="card" style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', margin: '0 0 4px' }}>step 1</p>
          <h2 style={{ fontSize: 16, margin: '0 0 14px' }}>Create your account</h2>

          <div className="field">
            <label>First name</label>
            <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Sam" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="name@email.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="At least 8 characters" />
          </div>

          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 16 }}>
            <input type="checkbox" checked={form.ageConfirmed} onChange={e => update('ageConfirmed', e.target.checked)} style={{ marginTop: 3 }} />
            I'm 18 or older and setting this up on my own device.
          </label>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" disabled={!canContinueStep1 || loading} onClick={handleCreateAccount}>
            {loading ? 'Creating account…' : 'Continue'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card" style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', margin: '0 0 4px' }}>step 2</p>
          <h2 style={{ fontSize: 16, margin: '0 0 6px' }}>Invite your partner</h2>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
            Choose someone you trust. They'll see exactly what their role involves before they accept.
          </p>

          <div className="field">
            <label>Their name</label>
            <input value={form.partnerName} onChange={e => update('partnerName', e.target.value)} placeholder="Jordan" />
          </div>
          <div className="field">
            <label>Their email</label>
            <input type="email" value={form.partnerEmail} onChange={e => update('partnerEmail', e.target.value)} placeholder="jordan@email.com" />
          </div>

          <button className="btn btn-primary" disabled={!canContinueStep2} onClick={() => setStep(3)}>
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="card" style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', margin: '0 0 4px' }}>step 3</p>
          <h2 style={{ fontSize: 16, margin: '0 0 14px' }}>
            What {form.partnerName || 'your partner'} will actually see
          </h2>

          <Row icon="✓" color="var(--color-teal)" text={`The actual flagged image and search term, sent only to ${form.partnerName || 'them'}`} />
          <Row icon="✓" color="var(--color-teal)" text={`Permanently deleted from our servers the moment ${form.partnerName || 'they'} mark it reviewed`} />
          <Row icon="✕" color="var(--color-danger)" text="Never kept on your device or account, before or after" />
          <Row icon="!" color="var(--color-ink-muted)" text="If protection is turned off or the app is removed" />

          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', margin: '14px 0', lineHeight: 1.5 }}>
            Because {form.partnerName || 'your partner'} will receive explicit material as part of this role, we ask both of you to confirm this arrangement.
          </p>

          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 10 }}>
            <input type="checkbox" checked={form.consentSelf} onChange={e => update('consentSelf', e.target.checked)} style={{ marginTop: 3 }} />
            I'm {form.name || 'the account owner'}, and I want {form.partnerName || 'my partner'} to receive this on my behalf.
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 16 }}>
            <input type="checkbox" checked={form.consentPartner} onChange={e => update('consentPartner', e.target.checked)} style={{ marginTop: 3 }} />
            {form.partnerName || 'They'} have agreed to this role and are 18 or older.
          </label>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" disabled={!canFinish || loading} onClick={handleSendInvite}>
            {loading ? 'Sending invite…' : 'Send invite'}
          </button>
        </div>
      )}
    </div>
  );
}

function StepDots({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {[1, 2, 3].map((n) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: n < 3 ? 1 : 'unset' }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: n <= step ? 'var(--color-beacon)' : 'var(--color-surface-muted)',
            color: n <= step ? 'var(--color-beacon-ink)' : 'var(--color-ink-muted)',
            fontSize: 12, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{n}</div>
          {n < 3 && <div style={{ flex: 1, height: 2, background: 'var(--color-border)' }} />}
        </div>
      ))}
    </div>
  );
}

function Row({ icon, color, text }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
      <span style={{ color, fontSize: 14, fontWeight: 600, width: 16 }}>{icon}</span>
      <p style={{ fontSize: 13, margin: 0 }}>{text}</p>
    </div>
  );
}
