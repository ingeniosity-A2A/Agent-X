'use client';

/**
 * HelpAssemblyConsole — Placeholder for the Help Assembly rendering service.
 * Will be wrapped in ArrowContainer (Shadow DOM) for style isolation.
 */
export default function HelpAssemblyConsole() {
  return (
    <div style={{
      width: '100%', minHeight: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px',
      fontFamily: '"Rajdhani", sans-serif',
      color: '#f4f4f2', background: 'linear-gradient(145deg, #0b0b0b, #020202)',
      borderRadius: '12px',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #111, #1a1a1a)',
        border: '1px solid rgba(212,168,75,.3)', borderRadius: '8px',
        padding: '6px 16px', fontSize: '14px', letterSpacing: '.16em',
        color: '#d4a84b', fontFamily: '"Share Tech Mono", monospace',
        marginBottom: '24px',
      }}>
        HELP ASSEMBLY
      </div>
      <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '.08em', marginBottom: '12px' }}>
        Help Assembly Console
      </h2>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.45)', textAlign: 'center', maxWidth: '400px', lineHeight: 1.6 }}>
        Help Assembly rendering service container.
        Content isolated via Arrow JS Shadow DOM boundary.
      </p>

      <div style={{
        marginTop: '32px', display: 'flex', gap: '12px', alignItems: 'center',
      }}>
        {['Knowledge Base', 'Auto-Resolve', 'Escalation'].map(label => (
          <div key={label} style={{
            padding: '8px 16px', borderRadius: '8px',
            border: '1px solid rgba(212,168,75,.15)',
            background: 'rgba(212,168,75,.05)',
            fontSize: '11px', letterSpacing: '.1em', color: '#d4a84b',
            fontFamily: '"Share Tech Mono", monospace',
            textTransform: 'uppercase',
          }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
