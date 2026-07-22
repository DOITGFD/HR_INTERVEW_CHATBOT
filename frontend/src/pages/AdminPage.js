// src/pages/AdminPage.js
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { Card, Btn, Badge, StatCard, Input, Select, Alert, Spinner, Empty } from '../components/UI';
import { PageHeader } from '../components/Layout';

const TABS = ['Overview','Users','Questions','Interviews'];

export default function AdminPage() {
  const [tab,       setTab]       = useState('Overview');
  const [stats,     setStats]     = useState(null);
  const [users,     setUsers]     = useState([]);
  const [questions, setQuestions] = useState([]);
  const [allIvs,    setAllIvs]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState('');
  const [newQ,      setNewQ]      = useState({ text:'', domain:'hr', difficulty:'Medium', tags:'' });

  useEffect(() => {
    adminAPI.stats().then(r => setStats(r.data)).catch(()=>{});
  }, []);

  useEffect(() => {
    setLoading(true);
    if (tab === 'Users')      adminAPI.users().then(r => setUsers(r.data.users||[])).finally(()=>setLoading(false));
    if (tab === 'Questions')  adminAPI.questions().then(r => setQuestions(r.data||[])).finally(()=>setLoading(false));
    if (tab === 'Interviews') adminAPI.allInterviews().then(r => setAllIvs(r.data.interviews||[])).finally(()=>setLoading(false));
    if (tab === 'Overview')   setLoading(false);
  }, [tab]);

  const addQuestion = async () => {
    if (!newQ.text.trim()) return;
    try {
      const tags = newQ.tags.split(',').map(t=>t.trim()).filter(Boolean);
      await adminAPI.addQuestion({ ...newQ, tags });
      setMsg('Question added!');
      setNewQ({ text:'', domain:'hr', difficulty:'Medium', tags:'' });
      adminAPI.questions().then(r => setQuestions(r.data||[]));
    } catch { setMsg('Error adding question'); }
    setTimeout(()=>setMsg(''),3000);
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    await adminAPI.deleteQuestion(id);
    setQuestions(q => q.filter(x => x._id !== id));
  };

  const scoreColor = s => s >= 7 ? '#34d399' : s >= 5 ? '#fbbf24' : '#f87171';

  return (
    <>
      <PageHeader title="Admin Panel" subtitle="Platform management & analytics"/>
      <div style={{ padding:32 }}>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:28, background:'#111118', borderRadius:10, padding:4, width:'fit-content' }}>
          {TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:'8px 20px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:500, transition:'all 0.2s',
              background: tab===t ? '#7c6fff' : 'transparent',
              color: tab===t ? 'white' : '#9090b0',
            }}>{t}</button>
          ))}
        </div>

        {/* ── Overview ────────────────────────────────────── */}
        {tab === 'Overview' && stats && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              <StatCard label="Total Users"      value={stats.totalUsers}       color="#c4b5fd"/>
              <StatCard label="Total Interviews" value={stats.totalInterviews}  color="#2dd4bf"/>
              <StatCard label="Completed"        value={stats.completedCount}   color="#34d399"/>
              <StatCard label="Avg Score"        value={`${stats.averageScore}/10`} color="#fbbf24"/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <Card>
                <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, marginBottom:16 }}>📊 Domain Breakdown</h3>
                {(stats.byDomain||[]).map(d => (
                  <div key={d._id} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:13 }}>{d._id}</span>
                      <span style={{ fontSize:13, fontWeight:600 }}>{d.count} interviews · avg {d.avgScore?.toFixed(1)}/10</span>
                    </div>
                    <div style={{ height:6, borderRadius:3, background:'#22223a', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${(d.avgScore/10)*100}%`, background:'#7c6fff', borderRadius:3 }}/>
                    </div>
                  </div>
                ))}
              </Card>
              <Card>
                <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, marginBottom:12 }}>ℹ️ Platform Info</h3>
                {[
                  ['Completion rate', `${stats.completionRate}%`],
                  ['Average score',   `${stats.averageScore}/10`],
                  ['Total interviews',stats.totalInterviews],
                  ['Active users',    stats.totalUsers],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize:13, color:'#9090b0' }}>{k}</span>
                    <span style={{ fontSize:13, fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              </Card>
            </div>
          </>
        )}

        {/* ── Users ──────────────────────────────────────── */}
        {tab === 'Users' && (
          <Card>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, marginBottom:16 }}>👥 All Users</h3>
            {loading ? <Spinner size={24}/> : users.length === 0 ? <Empty icon="👤" title="No users found"/> :
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                    {['Name','Email','Role','Joined'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'8px 12px', color:'#9090b0', fontWeight:500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding:'10px 12px', fontWeight:500 }}>{u.name}</td>
                      <td style={{ padding:'10px 12px', color:'#9090b0' }}>{u.email}</td>
                      <td style={{ padding:'10px 12px' }}><Badge color={u.role==='admin'?'amber':'purple'}>{u.role}</Badge></td>
                      <td style={{ padding:'10px 12px', color:'#9090b0' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </Card>
        )}

        {/* ── Questions ───────────────────────────────────── */}
        {tab === 'Questions' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <Card>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, marginBottom:16 }}>➕ Add Question</h3>
              {msg && <Alert type={msg.includes('Error')?'error':'success'}>{msg}</Alert>}
              <div style={{ marginBottom:12 }}>
                <p style={{ fontSize:12, color:'#9090b0', marginBottom:6 }}>Question Text</p>
                <textarea value={newQ.text} onChange={e=>setNewQ(q=>({...q,text:e.target.value}))}
                  placeholder="Enter interview question…" rows={3}
                  style={{ width:'100%', background:'#1a1a26', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'#f0f0ff', padding:'10px 14px', fontSize:13, fontFamily:'DM Sans,sans-serif', resize:'vertical', outline:'none' }}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                <div>
                  <p style={{ fontSize:12, color:'#9090b0', marginBottom:6 }}>Domain</p>
                  <select value={newQ.domain} onChange={e=>setNewQ(q=>({...q,domain:e.target.value}))}
                    style={{ width:'100%', background:'#1a1a26', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'#f0f0ff', padding:'9px 12px', fontSize:13, cursor:'pointer' }}>
                    {['hr','technical','coding','custom'].map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ fontSize:12, color:'#9090b0', marginBottom:6 }}>Difficulty</p>
                  <select value={newQ.difficulty} onChange={e=>setNewQ(q=>({...q,difficulty:e.target.value}))}
                    style={{ width:'100%', background:'#1a1a26', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'#f0f0ff', padding:'9px 12px', fontSize:13, cursor:'pointer' }}>
                    {['Easy','Medium','Hard'].map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <Input label="Tags (comma-separated)" placeholder="leadership, STAR, teamwork"
                value={newQ.tags} onChange={e=>setNewQ(q=>({...q,tags:e.target.value}))}/>
              <Btn variant="primary" style={{ width:'100%' }} onClick={addQuestion}>Add Question</Btn>
            </Card>

            <Card>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, marginBottom:16 }}>📚 Question Bank ({questions.length})</h3>
              {loading ? <Spinner size={24}/> : questions.length === 0 ? <Empty icon="📝" title="No questions yet"/> :
                <div style={{ maxHeight:450, overflowY:'auto' }}>
                  {questions.map(q => (
                    <div key={q._id} style={{ padding:'12px', borderRadius:8, background:'#1a1a26', marginBottom:8, border:'1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize:13, marginBottom:8 }}>{q.text}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'space-between' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <Badge color="purple">{q.domain}</Badge>
                          <Badge color={q.difficulty==='Hard'?'red':q.difficulty==='Medium'?'amber':'green'}>{q.difficulty}</Badge>
                        </div>
                        <button onClick={()=>deleteQuestion(q._id)} style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:13 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </Card>
          </div>
        )}

        {/* ── All Interviews ──────────────────────────────── */}
        {tab === 'Interviews' && (
          <Card>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, marginBottom:16 }}>🗂 All Interviews</h3>
            {loading ? <Spinner size={24}/> : allIvs.length === 0 ? <Empty icon="📋" title="No interviews yet"/> :
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                    {['User','Domain','Difficulty','Score','Status','Date'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'8px 12px', color:'#9090b0', fontWeight:500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allIvs.map(iv => (
                    <tr key={iv._id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding:'10px 12px' }}>{iv.userId?.name || 'Unknown'}</td>
                      <td style={{ padding:'10px 12px', color:'#9090b0' }}>{iv.domain}</td>
                      <td style={{ padding:'10px 12px' }}><Badge color={iv.difficulty==='Hard'?'red':iv.difficulty==='Medium'?'amber':'green'}>{iv.difficulty}</Badge></td>
                      <td style={{ padding:'10px 12px', fontWeight:700, color:scoreColor(iv.overallScore) }}>{iv.overallScore ?? '—'}/10</td>
                      <td style={{ padding:'10px 12px' }}><Badge color={iv.status==='completed'?'green':iv.status==='abandoned'?'red':'amber'}>{iv.status}</Badge></td>
                      <td style={{ padding:'10px 12px', color:'#9090b0' }}>{new Date(iv.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </Card>
        )}
      </div>
    </>
  );
}
