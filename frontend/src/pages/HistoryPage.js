// src/pages/HistoryPage.js
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart, LineController, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { interviewAPI } from '../services/api';
import { Card, Badge, Btn, Empty, Spinner, StatCard } from '../components/UI';
import { PageHeader } from '../components/Layout';

Chart.register(LineController, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const DOMAINS = { hr:'HR',technical:'Technical',coding:'Coding',custom:'Custom' };
const domainIcon = d => ({ hr:'🤝',technical:'⚙️',coding:'💻',custom:'✨' })[d] || '📝';

export default function HistoryPage() {
  const nav = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState({ domain:'', difficulty:'' });
  const chartRef    = useRef();
  const chartInst   = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit:50, status:'completed' };
      if (filter.domain)     params.domain     = filter.domain;
      if (filter.difficulty) params.difficulty  = filter.difficulty;
      const { data } = await interviewAPI.list(params);
      setInterviews(data.interviews || []);
    } catch { setInterviews([]); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line

  // Draw progress chart
  useEffect(() => {
    if (!interviews.length || !chartRef.current) return;
    chartInst.current?.destroy();
    const last15 = [...interviews].reverse().slice(-15);
    chartInst.current = new Chart(chartRef.current, {
      type:'line',
      data:{
        labels: last15.map((_,i) => `#${i+1}`),
        datasets:[{
          label:'Score', data: last15.map(h => h.overallScore),
          borderColor:'#7c6fff', backgroundColor:'rgba(124,111,255,0.08)',
          fill:true, tension:0.4, pointBackgroundColor:'#7c6fff', borderWidth:2,
        }],
      },
      options:{
        responsive:true,
        scales:{
          y:{ min:0,max:10, grid:{color:'rgba(255,255,255,0.06)'}, ticks:{color:'#9090b0'} },
          x:{ grid:{display:false}, ticks:{color:'#9090b0'} },
        },
        plugins:{ legend:{display:false} },
      },
    });
    return () => chartInst.current?.destroy();
  }, [interviews]);

  const scoreColor = s => s >= 7 ? '#34d399' : s >= 5 ? '#fbbf24' : '#f87171';
  const avgScore   = interviews.length ? Math.round(interviews.reduce((a,h)=>a+(h.overallScore||0),0)/interviews.length*10)/10 : 0;
  const best       = interviews.length ? Math.max(...interviews.map(h=>h.overallScore||0)) : 0;

  return (
    <>
      <PageHeader title="Interview History" subtitle="Track your progress over time"/>
      <div style={{ padding:32 }}>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
          <StatCard label="Total Sessions" value={interviews.length} color="#c4b5fd"/>
          <StatCard label="Average Score"  value={`${avgScore}/10`}   color="#34d399"/>
          <StatCard label="Best Score"     value={`${best}/10`}       color="#fbbf24"/>
          <StatCard label="This Month"     value={interviews.filter(h=>new Date(h.createdAt)>new Date(Date.now()-30*86400000)).length} color="#2dd4bf"/>
        </div>

        {/* Progress chart */}
        {interviews.length > 1 && (
          <Card style={{ marginBottom:24 }}>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, marginBottom:16 }}>📈 Score Trend</h3>
            <canvas ref={chartRef} style={{ maxHeight:200 }}/>
          </Card>
        )}

        {/* Filters */}
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          <select value={filter.domain} onChange={e => setFilter(f=>({...f,domain:e.target.value}))}
            style={{ background:'#1a1a26', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'#f0f0ff', padding:'8px 14px', fontSize:13, cursor:'pointer' }}>
            <option value="">All Domains</option>
            {Object.entries(DOMAINS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filter.difficulty} onChange={e => setFilter(f=>({...f,difficulty:e.target.value}))}
            style={{ background:'#1a1a26', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'#f0f0ff', padding:'8px 14px', fontSize:13, cursor:'pointer' }}>
            <option value="">All Difficulties</option>
            {['Easy','Medium','Hard'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <Btn variant="ghost" size="sm" onClick={() => setFilter({domain:'',difficulty:''})}>Clear ✕</Btn>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner size={28}/></div>
        ) : interviews.length === 0 ? (
          <Empty icon="📚" title="No interviews yet" desc="Complete your first session to see history here."
            action={<Btn variant="primary" onClick={() => nav('/dashboard')}>Start Interview →</Btn>}/>
        ) : interviews.map((h,i) => (
          <div key={h._id||i} onClick={() => h._id && nav(`/report/${h._id}`)}
            style={{
              display:'flex', alignItems:'center', gap:16, padding:'16px 18px',
              borderRadius:12, background:'#111118', border:'1px solid rgba(255,255,255,0.07)',
              marginBottom:10, cursor:'pointer', transition:'border-color 0.2s',
            }}>
            <div style={{
              width:48, height:48, borderRadius:12, background:'rgba(124,111,255,0.1)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0,
            }}>{domainIcon(h.domain)}</div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:500, fontSize:15 }}>{DOMAINS[h.domain] || h.domain} Interview</p>
              <p style={{ fontSize:12, color:'#9090b0' }}>
                {h.difficulty} · {h.totalQuestions || '?'} questions ·{' '}
                {new Date(h.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
              </p>
            </div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:scoreColor(h.overallScore) }}>
              {h.overallScore ?? '—'}<span style={{ fontSize:12, color:'#9090b0', fontFamily:'DM Sans' }}>/10</span>
            </div>
            <Badge color={h.overallScore>=7?'green':h.overallScore>=5?'amber':'red'}>
              {h.overallScore>=7?'Excellent':h.overallScore>=5?'Good':'Improve'}
            </Badge>
            <span style={{ color:'#9090b0', fontSize:14 }}>→</span>
          </div>
        ))}
      </div>
    </>
  );
}
