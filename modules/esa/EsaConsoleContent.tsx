'use client';

import ArrowContainer from '@/components/ArrowContainer';
import { Database, Zap, ArrowRight, XCircle } from 'lucide-react';

/*
  ESA Console Content Component
  
  ESA is an EXTERNAL COMPANY that Ingeniosity provides services for.
  It has its OWN DuckDB. It does NOT access:
  - Docs (Ava007's knowledge base)
  - Ava007's internal intelligence
  - Ingeniosity internal systems

  This component is kept for reference but is NOT imported into page.tsx.
  ESA Console is rendered inline in page.tsx within an Arrow container.
*/

export function getEsaScopedCSS(): string {
  return `
    .esa-root { width:100%; height:100%; display:flex; flex-direction:column; font-family:inherit; color:inherit; }
    .esa-content { flex:1; overflow:auto; }
    .esa-scroll { max-width:80rem; margin:0 auto; width:100%; padding:24px; }
    .esa-grid { display:grid; gap:16px; }
    .esa-grid-2 { grid-template-columns:repeat(2,1fr); }
    .esa-card { border-radius:12px; border:1px solid var(--border,rgba(255,255,255,.08)); background:var(--card,#1e1e1e); padding:16px; }
    .esa-card-title { font-size:14px; font-weight:500; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
    .esa-card-body { display:flex; flex-direction:column; gap:10px; }
    .esa-heading { font-size:22px; font-weight:700; margin-bottom:4px; }
    .esa-subheading { font-size:13px; color:var(--muted-foreground,#a89984); margin-bottom:20px; }
    .esa-flow { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:8px 0; }
    .esa-flow-node { padding:6px 14px; border-radius:8px; background:var(--primary,#8ec07c); color:var(--primary-foreground,#282828); font-size:12px; font-weight:600; }
    .esa-flow-node p { margin:0; }
    .esa-stack-stat { display:flex; align-items:center; gap:12px; padding:16px; border-radius:10px; border:1px solid var(--border,rgba(255,255,255,.04)); background:var(--card,#1e1e1e); }
    .esa-stack-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .esa-stat-label { font-size:10px; color:var(--muted-foreground,#a89984); margin-top:6px; text-transform:uppercase; letter-spacing:.08em; }
    @media (max-width:768px) { .esa-grid-2 { grid-template-columns:1fr; } }
  `;
}

export default function EsaConsoleContent() {
  const esaCSS = getEsaScopedCSS();

  return (
    <ArrowContainer styles={esaCSS}>
      <div className="esa-root">
        <div className="esa-content"><div className="esa-scroll">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ padding: '2px 10px', borderRadius: 6, background: 'rgba(254,128,25,.12)', color: '#fe8019', fontSize: 11, fontWeight: 600, letterSpacing: '.06em' }}>EXTERNAL CLIENT</div>
              </div>
              <div className="esa-heading">ESA Console</div>
              <div className="esa-subheading">ESA is an external company with its own DuckDB. No docs access. No shared intelligence.</div>
            </div>
            <div className="esa-grid esa-grid-2">
              <div className="esa-card">
                <div className="esa-card-title"><Database style={{ width: 16, height: 16, color: '#83a598' }} /> ESA DuckDB</div>
                <div className="esa-card-body">
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>ESA manages its own DuckDB instance independently. Query capabilities are provided as a service by Ava007.</div>
                </div>
              </div>
              <div className="esa-card">
                <div className="esa-card-title"><Zap style={{ width: 16, height: 16, color: '#fabd2f' }} /> Service Stack</div>
                <div className="esa-card-body">
                  <div className="esa-flow">
                    {['Bash Computer', 'ESA DuckDB', 'Ava007 Services', 'ESA Platform'].map((node, i) => (
                      <div key={node} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="esa-flow-node"><p>{node}</p></div>
                        {i < 3 && <ArrowRight style={{ width: 12, height: 12, opacity: .4 }} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="esa-card">
              <div className="esa-card-title"><XCircle style={{ width: 16, height: 16, color: '#fb4934' }} /> Service Boundary</div>
              <div className="esa-card-body">
                <div className="esa-grid esa-grid-2">
                  <div className="esa-stack-stat">
                    <div className="esa-stack-icon" style={{ background: 'rgba(131,165,152,.1)' }}><Database style={{ width: 20, height: 20, color: '#83a598' }} /></div>
                    <div><div style={{ fontSize: 18, fontWeight: 800 }}>Own DuckDB</div><div className="esa-stat-label">Independent Data</div></div>
                  </div>
                  <div className="esa-stack-stat">
                    <div className="esa-stack-icon" style={{ background: 'rgba(251,73,60,.1)' }}><XCircle style={{ width: 20, height: 20, color: '#fb4934' }} /></div>
                    <div><div style={{ fontSize: 18, fontWeight: 800 }}>No Docs</div><div className="esa-stat-label">Separate Knowledge</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div></div>
      </div>
    </ArrowContainer>
  );
}
