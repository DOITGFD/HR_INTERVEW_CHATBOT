// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportAPI, interviewAPI } from '../services/api';
import { Card, Btn, Badge, StatCard, Empty, Spinner } from '../components/UI';
import { PageHeader } from '../components/Layout';

const DOMAINS = [
  { id:'hr',        label:'HR Behavioral', icon:'🤝', desc:'Behavioral & cultural fit' },
  { id:'technical', label:'Technical',     icon:'⚙️', desc:'System design & concepts' },
  { id:'coding',    label:'Coding Round',  icon:'💻', desc:'DSA & problem solving'    },
  { id:'custom',    label:'Custom Topic',  icon:'✨', desc:'Your own subject'          },
];
const DIFFICULTIES = ['Easy','Medium','Hard'];

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [domain,   setDomain]   = useState('hr');
  const [diff,     setDiff]     = useState('Medium');
  const [custom,   setCustom]   = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([
      reportAPI.stats().catch(() => ({ data: null })),
      interviewAPI.list({ limit:5, status:'completed' }).catch(() => ({ data: { interviews:[] } })),
    ]).then(([s, h]) => {
      setStats(s.data);
      setHistory(h.data?.interviews || []);
    }).finally(() => setLoading(false));
  }, []);

  const startInterview = async () => {
    if (domain === 'custom' && !custom.trim()) return;
    setStarting(true);
    nav('/interview/new', { state: { domain, difficulty: diff, customTopic: custom } });
  };

  const scoreColor = s => s >= 7 ? '#34d399' : s >= 5 ? '#fbbf24' : '#f87171';
  const domainIcon = d => DOMAINS.find(x => x.id === d)?.icon || '📝';
  const domainLabel= d => DOMAINS.find(x => x.id === d)?.label || d;

  return (
    <>
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0]} 👋`} subtitle="Ready for your next session?"/>
      <div style={{ padding:32 }}>

        {/* Stats row */}
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner size={28}/></div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
            <StatCard label="Total Interviews" value={stats?.total ?? 0}           sub="All time"        color="#c4b5fd"/>
            <StatCard label="Average Score"    value={`${stats?.averageScore ?? 0}/10`} sub="Overall"    color="#34d399"/>
            <StatCard label="Best Domain"
              value={stats?.byDomain ? Object.entries(stats.byDomain).sort((a,b)=>b[1].avg-a[1].avg)[0]?.[0]?.toUpperCase().slice(0,2) || '—' : '—'}
              sub="Highest avg" color="#fbbf24"/>
            <StatCard label="Completed" value={stats?.total ?? 0} sub="Keep going!" color="#2dd4bf"/>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>

          {/* ── Start interview form ────────────────────────── */}
          <Card glow>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:700, marginBottom:20 }}>🎯 Start New Interview</h3>

            {/* Domain grid */}
            <p style={{ fontSize:12, color:'#9090b0', marginBottom:10, fontWeight:500 }}>Choose Domain</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
              {DOMAINS.map(d => (
                <div key={d.id} onClick={() => setDomain(d.id)} style={{
                  background: domain===d.id ? 'rgba(124,111,255,0.1)' : '#1a1a26',
                  border:`1px solid ${domain===d.id ? '#7c6fff' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius:10, padding:'12px 14px', cursor:'pointer', transition:'all 0.2s',
                  textAlign:'center',
                }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>{d.icon}</div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{d.label}</div>
                  <div style={{ fontSize:11, color:'#9090b0' }}>{d.desc}</div>
                </div>
              ))}
            </div>

            {/* Custom topic */}
            {domain === 'custom' && (
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:12, color:'#9090b0', marginBottom:6, fontWeight:500 }}>Topic</p>
                <input value={custom} onChange={e => setCustom(e.target.value)}
                  placeholder="e.g. Machine Learning, React, SQL…"
                  style={{
                    width:'100%', background:'#1a1a26', border:'1px solid rgba(255,255,255,0.15)',
                    borderRadius:8, color:'#f0f0ff', padding:'10px 14px', fontSize:14,
                    outline:'none', fontFamily:'DM Sans,sans-serif',
                  }}/>
              </div>
            )}

            {/* Difficulty */}
            <p style={{ fontSize:12, color:'#9090b0', marginBottom:8, fontWeight:500 }}>Difficulty</p>
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setDiff(d)} style={{
                  padding:'8px 20px', borderRadius:20, cursor:'pointer', fontSize:13, fontWeight:500,
                  border:`1px solid ${diff===d ? '#7c6fff' : 'rgba(255,255,255,0.15)'}`,
                  background: diff===d ? 'rgba(124,111,255,0.15)' : '#1a1a26',
                  color: diff===d ? '#c4b5fd' : '#9090b0', transition:'all 0.18s',
                }}>{d}</button>
              ))}
            </div>

            <Btn variant="primary" size="lg" style={{ width:'100%' }}
              onClick={startInterview} disabled={starting || (domain==='custom' && !custom.trim())}>
              {starting ? <><Spinner size={16} color="white"/> Starting…</> : '🚀 Start Interview'}
            </Btn>
          </Card>

          {/* ── Recent history ──────────────────────────────── */}
          <Card>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:700 }}>📋 Recent Sessions</h3>
              <Btn variant="ghost" size="sm" onClick={() => nav('/history')}>View all →</Btn>
            </div>

            {history.length === 0 ? (
              <Empty icon="🚀" title="No sessions yet" desc="Complete your first interview above!"/>
            ) : history.map((h, i) => (
              <div key={h._id || i} onClick={() => h._id && nav(`/report/${h._id}`)}
                style={{
                  display:'flex', alignItems:'center', gap:14, padding:'14px 12px',
                  borderRadius:10, background:'#1a1a26', border:'1px solid rgba(255,255,255,0.06)',
                  marginBottom:10, cursor:'pointer', transition:'border-color 0.2s',
                }}>
                <div style={{
                  width:44, height:44, borderRadius:10,
                  background:'rgba(124,111,255,0.1)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0,
                }}>{domainIcon(h.domain)}</div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:500 }}>{domainLabel(h.domain)}</p>
                  <p style={{ fontSize:12, color:'#9090b0' }}>
                    {h.difficulty} · {new Date(h.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:700, color: scoreColor(h.overallScore) }}>
                  {h.overallScore ?? '—'}<span style={{ fontSize:12, color:'#9090b0' }}>/10</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
