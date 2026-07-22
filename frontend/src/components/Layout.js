// src/components/Layout.js — Sidebar + main layout
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './UI';

const NAV = [
  { path:'/dashboard', icon:'🏠', label:'Dashboard' },
  { path:'/history',   icon:'📋', label:'History' },
  { path:'/report',    icon:'📊', label:'Reports',  hide: true },  // only shown if active
  { path:'/admin',     icon:'⚙️', label:'Admin',   adminOnly: true },
  { path:'/settings',  icon:'👤', label:'Settings' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav      = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const visibleNav = NAV.filter(n =>
    !n.hide &&
    (!n.adminOnly || user?.role === 'admin')
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 64 : 232,
        background:'#111118',
        borderRight:'1px solid rgba(255,255,255,0.08)',
        display:'flex', flexDirection:'column',
        padding: collapsed ? '20px 10px' : '24px 14px',
        position:'fixed', top:0, left:0, bottom:0,
        transition:'width 0.25s ease',
        zIndex:100,
        overflow:'hidden',
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32, padding:'0 6px' }}>
          <div style={{
            width:36, height:36, borderRadius:10, flexShrink:0,
            background:'linear-gradient(135deg,#7c6fff,#f472b6)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
          }}>🤖</div>
          {!collapsed && <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15, whiteSpace:'nowrap' }}>InterviewBot</span>}
        </div>

        {/* Nav items */}
        <nav style={{ flex:1 }}>
          {!collapsed && <p style={{ fontSize:10, color:'#5a5a80', textTransform:'uppercase', letterSpacing:'0.1em', padding:'0 10px', marginBottom:6 }}>Navigation</p>}
          {visibleNav.map(n => {
            const active = location.pathname.startsWith(n.path);
            return (
              <button key={n.path} onClick={() => nav(n.path)} style={{
                display:'flex', alignItems:'center', gap:10,
                padding: collapsed ? '10px' : '10px 12px',
                borderRadius:8, cursor:'pointer', border:'none', width:'100%',
                textAlign:'left', marginBottom:2, transition:'all 0.15s',
                background: active ? 'rgba(124,111,255,0.15)' : 'transparent',
                color: active ? '#c4b5fd' : '#9090b0',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{n.icon}</span>
                {!collapsed && <span style={{ fontSize:14, fontWeight:400, whiteSpace:'nowrap' }}>{n.label}</span>}
              </button>
            );
          })}

          {/* Quick-start section */}
          {!collapsed && (
            <>
              <p style={{ fontSize:10, color:'#5a5a80', textTransform:'uppercase', letterSpacing:'0.1em', padding:'16px 10px 6px' }}>Quick Start</p>
              {[
                { label:'HR Interview',   icon:'🤝', domain:'hr',        diff:'Medium' },
                { label:'Technical',      icon:'⚙️', domain:'technical', diff:'Medium' },
                { label:'Coding Round',   icon:'💻', domain:'coding',    diff:'Hard'   },
              ].map(q => (
                <button key={q.domain} onClick={() => nav('/interview/new', { state: q })} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'9px 12px', borderRadius:8, cursor:'pointer',
                  border:'none', width:'100%', textAlign:'left', transition:'all 0.15s',
                  background:'transparent', color:'#9090b0', marginBottom:2,
                }}>
                  <span style={{ fontSize:15 }}>{q.icon}</span>
                  <span style={{ fontSize:13 }}>{q.label}</span>
                </button>
              ))}
            </>
          )}
        </nav>

        {/* User + collapse toggle */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:14, display:'flex', flexDirection:'column', gap:8 }}>
          <button onClick={() => setCollapsed(c => !c)} style={{
            background:'transparent', border:'none', color:'#5a5a80',
            cursor:'pointer', padding:'6px 10px', borderRadius:6, fontSize:12,
            textAlign: collapsed ? 'center' : 'right',
          }}>{collapsed ? '→' : '← Collapse'}</button>

          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 8px' }}>
            <Avatar name={user?.name || '?'} size={32}/>
            {!collapsed && (
              <div style={{ flex:1, overflow:'hidden' }}>
                <p style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</p>
                <p style={{ fontSize:11, color:'#5a5a80' }}>{user?.role}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={logout} style={{
                background:'transparent', border:'none', color:'#5a5a80',
                cursor:'pointer', fontSize:16, padding:4,
              }} title="Logout">↩</button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <main style={{ marginLeft: collapsed ? 64 : 232, flex:1, transition:'margin-left 0.25s ease', minHeight:'100vh', overflowY:'auto' }}>
        {children}
      </main>
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      height:60, borderBottom:'1px solid rgba(255,255,255,0.08)',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 32px', background:'#0a0a0f',
      position:'sticky', top:0, zIndex:50,
    }}>
      <div>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:600 }}>{title}</h2>
        {subtitle && <p style={{ fontSize:12, color:'#9090b0', marginTop:1 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display:'flex', gap:10, alignItems:'center' }}>{actions}</div>}
    </div>
  );
}
