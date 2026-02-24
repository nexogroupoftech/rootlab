'use client';

import { useState, useEffect } from 'react';

const SECTION_DEFS = [
  { emoji: '🌱', key: 'ROOT',     num: '01' },
  { emoji: '🧠', key: 'CORE',     num: '02' },
  { emoji: '🌿', key: 'BRANCHES', num: '03' },
  { emoji: '🍎', key: 'FRUIT',    num: '04' },
  { emoji: '🌰', key: 'SEEDS',    num: '05' },
];

function esc(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineFmt(t) {
  return esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<span style="color:#00ff9d;font-weight:700">$1</span>')
    .replace(/\*([^*\n]+?)\*/g, '<span style="color:#ffd166;font-style:italic">$1</span>')
    .replace(/`([^`\n]+?)`/g, '<code style="background:#020507;border:1px solid #1c2d3f;padding:1px 6px;color:#00ff9d;font-size:12px;font-family:monospace">$1</code>');
}

function isDiagramLine(t) {
  if (!t) return false;
  const cnt = (t.match(/[→↓↑←│─┌└├┤╔╚║═┐┘╗╝]/g) || []).length;
  return cnt >= 2 || (cnt >= 1 && t.length < 60 && /^[\s→↓↑←│─[\]|+\-A-Za-z0-9():.]+$/.test(t));
}

function parseSections(text) {
  const re = /(🌱|🧠|🌿|🍎|🌰)\s*(ROOT|CORE|BRANCHES|FRUIT|SEEDS)/g;
  const matches = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    matches.push({ emoji: m[1], key: m[2], start: m.index, end: m.index + m[0].length });
  }
  return matches.map((match, i) => {
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].start : text.length;
    return { emoji: match.emoji, key: match.key, body: text.slice(match.end, bodyEnd).trim() };
  });
}

function BodyRenderer({ text }) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  let paraLines = [];
  let key = 0;

  function flushPara() {
    const raw = paraLines.join(' ').trim();
    paraLines = [];
    if (!raw) return;
    elements.push(
      <p key={key++} style={{ marginBottom: 12, lineHeight: 1.85 }}
        dangerouslySetInnerHTML={{ __html: inlineFmt(raw) }} />
    );
  }

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (isDiagramLine(t)) {
      flushPara();
      const asc = [];
      while (i < lines.length && (isDiagramLine(lines[i].trim()) || lines[i].trim() === '') && asc.length < 20) {
        asc.push(lines[i]);
        i++;
        const nxt = lines[i]?.trim();
        if (nxt && !isDiagramLine(nxt) && nxt !== '' && asc.length >= 1 && asc[asc.length - 1].trim() === '') break;
      }
      while (asc.length && asc[asc.length - 1].trim() === '') asc.pop();
      if (asc.length) {
        elements.push(
          <div key={key++} style={{ background: '#020507', border: '1px solid #1c2d3f', borderLeft: '3px solid #7b61ff', padding: '14px 18px', margin: '14px 0', fontFamily: 'monospace', fontSize: 12, color: '#00e5ff', overflowX: 'auto', lineHeight: 1.6, whiteSpace: 'pre', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 6, right: 12, fontSize: 9, color: '#2a4050', letterSpacing: '0.1em' }}>// diagram</span>
            {asc.join('\n')}
          </div>
        );
      }
      continue;
    }

    if (/^\*\*[^*]+\*\*:?\s*$/.test(t)) {
      flushPara();
      const label = t.replace(/\*\*/g, '').replace(/:$/, '').trim();
      elements.push(
        <div key={key++} style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 16, marginBottom: 4 }}>
          <span style={{ color: '#00e5ff', fontSize: 10 }}>◆</span>
          <span style={{ color: '#00ff9d', fontWeight: 700, fontSize: 13 }}>{label}</span>
        </div>
      );
      i++; continue;
    }

    if (/^[-•*]\s+/.test(t) && t.length > 2) {
      flushPara();
      const items = [];
      while (i < lines.length && /^[-•*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={key++} style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: 10, marginBottom: 8, lineHeight: 1.7 }}>
              <span style={{ color: '#00e5ff', flexShrink: 0 }}>▸</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFmt(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+[.)]\s+/.test(t)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={key++} style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: 10, marginBottom: 8, lineHeight: 1.7 }}>
              <span style={{ color: '#00e5ff', flexShrink: 0 }}>▸</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFmt(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (t === '') { flushPara(); i++; continue; }
    paraLines.push(t);
    i++;
  }
  flushPara();
  return <>{elements}</>;
}

function SeedsRenderer({ text }) {
  const lines = text.split('\n').filter(l => l.trim());
  const qs = [];
  let cur = '';
  for (const line of lines) {
    const t = line.trim();
    if (/^\d+[.)]\s+/.test(t)) { if (cur) qs.push(cur); cur = t.replace(/^\d+[.)]\s+/, ''); }
    else if (/^[-•]\s+/.test(t)) { if (cur) qs.push(cur); cur = t.replace(/^[-•]\s+/, ''); }
    else if (cur) cur += ' ' + t;
    else cur = t;
  }
  if (cur) qs.push(cur);

  return (
    <>
      {qs.slice(0, 5).map((q, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < 4 ? '1px solid #0e1a24' : 'none' }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 10, color: '#7b61ff', flexShrink: 0, marginTop: 3, minWidth: 32 }}>
            Q{String(i + 1).padStart(2, '0')}
          </span>
          <span style={{ lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: inlineFmt(q) }} />
        </div>
      ))}
    </>
  );
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Advanced');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [sections, setSections] = useState([]);
  const [status, setStatus] = useState('READY');
  const [error, setError] = useState('');
  const [tokens, setTokens] = useState('');
  const [done, setDone] = useState(false);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  async function run() {
    if (streaming) return;
    if (!topic.trim()) { setError('TOPIC_REQUIRED: Input cannot be empty.'); return; }

    setError(''); setSections([]); setStreamText(''); setDone(false);
    setStreaming(true); setStatus('CONNECTING');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), level }),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'API_ERROR ' + res.status);
      }

      setStatus('STREAMING');

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = '';

      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        full += dec.decode(value, { stream: true });
        setStreamText(full);
      }

      const parsed = parseSections(full);
      setSections(parsed);
      setTokens('~' + Math.round(full.length / 3.8) + ' TOKENS');
      setDone(true);
      setStatus('COMPLETE');
      setTimeout(() => setStatus('READY'), 3000);

    } catch (err) {
      setError(err.message || 'RUNTIME_ERROR');
      setStatus('ERROR');
      setTimeout(() => setStatus('READY'), 3000);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <main style={{ position: 'relative', zIndex: 1, maxWidth: 820, margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 30, letterSpacing: '0.12em', color: 'var(--accent)', textShadow: '0 0 30px rgba(0,229,255,0.4),0 0 60px rgba(0,229,255,0.15)', lineHeight: 1, marginBottom: 8 }}>
              ROOTLAB
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', padding: '3px 10px', fontSize: 9, letterSpacing: '0.2em', color: 'var(--accent)', fontFamily: 'var(--display)' }}>
              <span style={{ width: 5, height: 5, background: 'var(--accent2)', borderRadius: '50%', display: 'inline-block' }} />
              NEXOCORP · GEMINI · v2.0
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-faint)', lineHeight: 2 }}>
            <div>SYS // GEMINI 1.5 FLASH</div>
            <div>STREAM // ENABLED</div>
            <div style={{ color: 'var(--accent2)' }}>● ONLINE</div>
            <div>{clock}</div>
          </div>
        </div>
        <div style={{ height: 1, background: 'linear-gradient(90deg,var(--accent),rgba(0,229,255,0.1),transparent)' }} />
      </div>

      {/* FORM */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--display)' }}>
          <span style={{ color: 'var(--accent)' }}>{'>'}</span> INITIALIZE QUERY
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 2 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', fontSize: 12, opacity: 0.7, pointerEvents: 'none' }}>_</span>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && run()}
              placeholder="Enter topic — Transformers, CRISPR, Quantum Computing..."
              style={{ width: '100%', background: 'var(--panel)', border: '1px solid var(--border3)', borderRight: 'none', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, padding: '14px 16px 14px 32px' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <select value={level} onChange={e => setLevel(e.target.value)}
              style={{ background: 'var(--panel)', border: '1px solid var(--border3)', borderRight: 'none', color: 'var(--accent)', fontFamily: 'var(--display)', fontSize: 10, letterSpacing: '0.1em', padding: '14px 36px 14px 16px', cursor: 'pointer', appearance: 'none' }}>
              <option value="Advanced">ADV</option>
              <option value="Intermediate">MID</option>
              <option value="Beginner">BEG</option>
            </select>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', fontSize: 10, pointerEvents: 'none' }}>▾</span>
          </div>
          <button onClick={run} disabled={streaming}
            style={{ background: streaming ? 'var(--border2)' : 'var(--accent)', border: 'none', color: streaming ? 'var(--text-dim)' : '#040608', fontFamily: 'var(--display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', padding: '14px 24px', cursor: streaming ? 'not-allowed' : 'pointer', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {streaming ? 'RUNNING...' : 'EXECUTE'}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div style={{ padding: '12px 16px', border: '1px solid rgba(255,77,109,0.3)', background: 'rgba(255,77,109,0.05)', color: 'var(--red)', fontSize: 11, marginBottom: 20 }}>
          // ERROR: {error}
        </div>
      )}

      {/* STATUS */}
      {(streaming || status === 'COMPLETE' || status === 'ERROR') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', border: '1px solid var(--border3)', background: 'var(--panel)', marginBottom: 24, fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 5, height: 5, background: 'var(--accent)', borderRadius: '50%', opacity: streaming ? 1 : 0.3 }} />
            ))}
          </div>
          <span style={{ color: 'var(--accent2)' }}>{status}</span>
          <span>
            {streaming ? 'Streaming from Gemini...' : status === 'COMPLETE' ? 'Done · ' + tokens : 'Check API key.'}
          </span>
        </div>
      )}

      {/* STREAM RAW */}
      {streaming && (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border2)', padding: '16px 20px', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.85, color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: 2 }}>
          {streamText}
          <span style={{ display: 'inline-block', width: 7, height: 14, background: 'var(--accent)', verticalAlign: 'middle', marginLeft: 2 }} />
        </div>
      )}

      {/* SECTIONS */}
      {done && sections.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'var(--panel)', border: '1px solid var(--border3)', borderBottom: '2px solid var(--accent)', marginBottom: 2 }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{topic.toUpperCase()}</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 10, color: 'var(--text-dim)' }}>
              <span>{tokens}</span>
              <span style={{ padding: '3px 10px', border: '1px solid rgba(123,97,255,0.4)', color: 'var(--accent3)', fontFamily: 'var(--display)', fontSize: 9, letterSpacing: '0.15em' }}>{level.toUpperCase()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sections.map((sec, idx) => {
              const def = SECTION_DEFS.find(d => d.key === sec.key) || { num: '0' + (idx + 1) };
              return (
                <div key={idx} style={{ border: '1px solid var(--border2)', background: 'var(--panel)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--border2)' }}>
                    <div style={{ padding: '10px 16px', fontSize: 18, borderRight: '1px solid var(--border2)', display: 'flex', alignItems: 'center', background: 'rgba(0,229,255,0.02)' }}>{sec.emoji}</div>
                    <div style={{ padding: '10px 16px', flex: 1 }}>
                      <div style={{ fontFamily: 'var(--display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)' }}>{sec.key}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>SECTION {def.num} / 05</div>
                    </div>
                    <div style={{ padding: '10px 16px', fontSize: 9, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--border2)' }}>
                      {level.toUpperCase()} // GEMINI
                    </div>
                  </div>
                  <div style={{ padding: '20px 24px', fontSize: 13, lineHeight: 1.85, color: 'var(--text)' }}>
                    {sec.key === 'SEEDS' ? <SeedsRenderer text={sec.body} /> : <BodyRenderer text={sec.body} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-faint)' }}>
        <span>ROOTLAB // NEXOCORP</span>
        <span style={{ color: status === 'COMPLETE' ? 'var(--accent2)' : 'var(--text-faint)' }}>{status}</span>
      </div>

    </main>
  );
}
