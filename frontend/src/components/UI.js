// src/components/UI.js — Reusable UI primitives
import React from 'react';

// ── Button ────────────────────────────────────────────────────
export function Btn({ children, variant='primary', size='md', disabled, onClick, style, type='button', className='' }) {
  const base = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
    border:'none', borderRadius: size==='lg' ? 14 : 8, cursor:'pointer',
    fontFamily:'DM Sans, sans-serif', fontWeight:500, transition:'all 0.18s',
    opacity: disabled ? 0.5 : 1,
    ...( size==='sm'  && { padding:'6px 14px',  fontSize:13 }),
    ...( size==='md'  && { padding:'10px 20px', fontSize:14 }),
    ...( size==='lg'  && { padding:'14px 28px', fontSize:15 }),
    ...( variant==='primary'   && { background:'#7c6fff', color:'white' }),
    ...( variant==='secondary' && { background:'#1a1a26', color:'#f0f0ff', border:'1px solid rgba(255,255,255,0.15)' }),
    ...( variant==='ghost'     && { background:'transparent', color:'#9090b0' }),
    ...( variant==='danger'    && { background:'rgba(248,113,113,0.15)', color:'#f87171' }),
    ...( variant==='success'   && { background:'rgba(52,211,153,0.15)', color:'#34d399' }),
    ...style,
  };
  return <button type={type} disabled={disabled} onClick={onClick} style={base} className={className}>{children}</button>;
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, glow, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:'rgba(255,255,255,0.03)',
      border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:14, padding:24,
      transition:'border-color 0.2s',
      cursor: onClick ? 'pointer' : 'default',
      ...(glow && { boxShadow:'0 0 40px rgba(124,111,255,0.12)' }),
      ...style,
    }}>{children}</div>
  );
}

// ── Input ─────────────────────────────────────────────────────
export function Input({ label, error, style, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:'block', fontSize:13, color:'#9090b0', marginBottom:6, fontWeight:500 }}>{label}</label>}
      <input style={{
        width:'100%', background:'#1a1a26', border:`1px solid ${error?'#f87171':'rgba(255,255,255,0.15)'}`,
        borderRadius:8, color:'#f0f0ff', padding:'10px 14px', fontSize:14,
        outline:'none', fontFamily:'DM Sans, sans-serif', transition:'border-color 0.2s', ...style,
      }} {...props}/>
      {error && <p style={{ color:'#f87171', fontSize:12, marginTop:4 }}>{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────
export function Select({ label, children, style, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:'block', fontSize:13, color:'#9090b0', marginBottom:6, fontWeight:500 }}>{label}</label>}
      <select style={{
        width:'100%', background:'#1a1a26', border:'1px solid rgba(255,255,255,0.15)',
        borderRadius:8, color:'#f0f0ff', padding:'10px 14px', fontSize:14,
        outline:'none', fontFamily:'DM Sans, sans-serif', cursor:'pointer', ...style,
      }} {...props}>{children}</select>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
export function Badge({ children, color='purple' }) {
  const colors = {
    purple: { bg:'rgba(124,111,255,0.15)', text:'#c4b5fd' },
    green:  { bg:'rgba(52,211,153,0.15)',  text:'#34d399' },
    red:    { bg:'rgba(248,113,113,0.15)', text:'#f87171' },
    amber:  { bg:'rgba(251,191,36,0.15)',  text:'#fbbf24' },
    teal:   { bg:'rgba(45,212,191,0.15)',  text:'#2dd4bf' },
    gray:   { bg:'rgba(144,144,176,0.15)', text:'#9090b0' },
  };
  const c = colors[color] || colors.purple;
  return (
    <span style={{
      padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:500,
      background: c.bg, color: c.text, display:'inline-block',
    }}>{children}</span>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size=20, color='#7c6fff' }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      border:`2px solid rgba(255,255,255,0.1)`,
      borderTopColor: color,
      animation:'spin 0.7s linear infinite',
      flexShrink:0,
    }}/>
  );
}

// ── Progress bar ──────────────────────────────────────────────
export function ProgressBar({ value, max=10, color }) {
  const pct = Math.min(100, (value / max) * 100);
  const c = color || (value >= 7 ? '#34d399' : value >= 5 ? '#fbbf24' : '#f87171');
  return (
    <div style={{ height:6, borderRadius:3, background:'#22223a', overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${pct}%`, background:c, borderRadius:3, transition:'width 0.5s ease' }}/>
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────
export function Divider({ style }) {
  return <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'20px 0', ...style }}/>;
}

// ── Stat card ─────────────────────────────────────────────────
export function StatCard({ label, value, sub, color='#c4b5fd' }) {
  return (
    <div style={{
      background:'#111118', border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:14, padding:20,
    }}>
      <p style={{ fontSize:11, color:'#5a5a80', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{label}</p>
      <p style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:700, color }}>{value}</p>
      {sub && <p style={{ fontSize:12, color:'#9090b0', marginTop:4 }}>{sub}</p>}
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────
export function Alert({ type='error', children }) {
  const styles = {
    error:   { bg:'rgba(248,113,113,0.1)',   border:'rgba(248,113,113,0.3)',   color:'#f87171' },
    success: { bg:'rgba(52,211,153,0.1)',    border:'rgba(52,211,153,0.3)',    color:'#34d399' },
    info:    { bg:'rgba(124,111,255,0.1)',   border:'rgba(124,111,255,0.3)',   color:'#c4b5fd' },
  };
  const s = styles[type] || styles.error;
  return (
    <div style={{
      background:s.bg, border:`1px solid ${s.border}`, color:s.color,
      borderRadius:8, padding:'12px 16px', fontSize:13, marginBottom:16,
    }}>{children}</div>
  );
}

// ── Avatar ────────────────────────────────────────────────────
export function Avatar({ name='?', size=36 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:'linear-gradient(135deg,#7c6fff,#2dd4bf)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontWeight:700, fontSize:size*0.38, color:'white',
    }}>{name[0]?.toUpperCase()}</div>
  );
}

// ── Empty state ───────────────────────────────────────────────
export function Empty({ icon='📭', title, desc, action }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:52, marginBottom:16 }}>{icon}</div>
      <h3 style={{ fontFamily:'Syne,sans-serif', marginBottom:8 }}>{title}</h3>
      {desc && <p style={{ color:'#9090b0', fontSize:14, marginBottom:20 }}>{desc}</p>}
      {action}
    </div>
  );
}

// ── Loading page ──────────────────────────────────────────────
export function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:16 }}>
      <Spinner size={36}/>
      <p style={{ color:'#9090b0', fontSize:14 }}>Loading…</p>
    </div>
  );
}
