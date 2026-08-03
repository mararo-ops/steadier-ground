export default function BeaconHero({ eyebrow, title, subtitle }) {
  return (
    <div style={{
      background: 'var(--color-navy)',
      borderRadius: 'var(--radius-lg)',
      padding: '28px 24px',
      marginBottom: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <svg
        viewBox="0 0 600 160"
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        <path d="M -20 160 Q 300 -40 620 160 Z" fill="var(--color-navy-mid)" />
        <path d="M 60 10 L 40 160 L 80 160 Z" fill="var(--color-navy-deep)" />
        <circle cx="60" cy="8" r="7" fill="var(--color-beacon)" />
        <path d="M 60 8 L 260 -30" stroke="var(--color-beacon)" strokeWidth="2" opacity="0.55" />
        <path d="M 60 8 L 260 46" stroke="var(--color-beacon)" strokeWidth="2" opacity="0.35" />
      </svg>
      <div style={{ position: 'relative' }}>
        {eyebrow && (
          <p style={{ fontSize: 13, color: 'var(--color-fog)', margin: '0 0 4px' }}>{eyebrow}</p>
        )}
        <h1 style={{ fontSize: 22, color: 'var(--color-parchment)', margin: '0 0 6px' }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--color-fog)', margin: 0 }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
