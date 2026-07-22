// src/pages/ReportPage.js
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart, RadarController, LineController, CategoryScale, LinearScale, PointElement, LineElement, RadialLinearScale, Filler, Tooltip } from 'chart.js';
import { reportAPI } from '../services/api';
import { Card, Btn, Badge, ProgressBar, Spinner, Empty } from '../components/UI';
import { PageHeader } from '../components/Layout';

Chart.register(RadarController, LineController, CategoryScale, LinearScale, PointElement, LineElement, RadialLinearScale, Filler, Tooltip);

export default function ReportPage() {
  const { id } = useParams();
  const nav     = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const radarRef  = useRef();
  const barRef    = useRef();
  const radarInst = useRef();
  const barInst   = useRef();

  useEffect(() => {
    reportAPI.get(id)
      .then(r => setData(r.data))
      .catch(() => setError('Report not found or access denied.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Draw charts after data loads
  useEffect(() => {
    if (!data?.summary?.scores?.length) return;
    const scores = data.summary.scores;
    const labels = scores.map((_, i) => `Q${i+1}`);
    const gridColor = 'rgba(255,255,255,0.07)';
    const tickColor = '#9090b0';

    // Radar
    radarInst.current?.destroy();
    if (radarRef.current && scores.length >= 3) {
      radarInst.current = new Chart(radarRef.current, {
        type:'radar',
        data:{
          labels,
          datasets:[{
            label:'Score', data:scores,
            backgroundColor:'rgba(124,111,255,0.12)',
            borderColor:'#7c6fff', pointBackgroundColor:'#7c6fff',
            borderWidth:2,
          }],
        },
        options:{
          responsive:true, maintainAspectRatio:true,
          scales:{ r:{ min:0, max:10, ticks:{display:false}, grid:{color:gridColor}, pointLabels:{color:tickColor,font:{size:12}} }},
          plugins:{ legend:{display:false} },
        },
      });
    }

    // Bar (as line)
    barInst.current?.destroy();
    if (barRef.current) {
      barInst.current = new Chart(barRef.current, {
        type:'line',
        data:{
          labels,
          datasets:[{
            label:'Score', data:scores,
            borderColor:'#7c6fff', backgroundColor:'rgba(124,111,255,0.08)',
            fill:true, tension:0.4,
            pointBackgroundColor: scores.map(s => s>=7?'#34d399':s>=5?'#fbbf24':'#f87171'),
            pointRadius:6, borderWidth:2,
          }],
        },
        options:{
          responsive:true,
          scales:{
            y:{ min:0, max:10, grid:{color:gridColor}, ticks:{color:tickColor} },
            x:{ grid:{display:false}, ticks:{color:tickColor} },
          },
          plugins:{ legend:{display:false} },
        },
      });
    }

    return () => { radarInst.current?.destroy(); barInst.current?.destroy(); };
  }, [data]);

  if (loading) return <div style={{display:'flex',justifyContent:'center',paddingTop:80}}><Spinner size={32}/></div>;
  if (error)   return <Empty icon="❌" title="Report Unavailable" desc={error}/>;
  if (!data)   return null;

  const { summary, interview } = data;
  const scoreColor = s => s >= 7 ? '#34d399' : s >= 5 ? '#fbbf24' : '#f87171';
  const gradeColor = summary.grade === 'A' ? '#34d399' : summary.grade === 'B' ? '#fbbf24' : '#f87171';
  const domainLabel = interview.domain === 'custom' ? interview.customTopic : interview.domain?.toUpperCase();

  return (
    <>
      <PageHeader
        title="Interview Report"
        subtitle={`${domainLabel} · ${interview.difficulty} · ${summary.answeredCount} questions`}
        actions={
          <div style={{ display:'flex', gap:10 }}>
            <Btn variant="secondary" size="sm" onClick={() => window.open(reportAPI.pdfUrl(id), '_blank')}>
              📄 Download PDF
            </Btn>
            <Btn variant="primary" size="sm" onClick={() => nav('/dashboard')}>
              🚀 New Interview
            </Btn>
          </div>
        }
      />
      <div style={{ padding:32 }}>

        {/* ── Overall score banner ──────────────────────────── */}
        <Card glow style={{ marginBottom:24, background:'linear-gradient(135deg,rgba(124,111,255,0.08),rgba(244,114,182,0.04))' }}>
          <div style={{ display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
            {/* Score donut */}
            <div style={{ position:'relative', width:100, height:100, flexShrink:0 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke={gradeColor} strokeWidth="10"
                  strokeDasharray={`${summary.overallScore * 26.39} 263.9`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                  style={{ transition:'stroke-dasharray 1s ease' }}/>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <p style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:gradeColor }}>{summary.overallScore}</p>
                <p style={{ fontSize:11, color:'#9090b0' }}>/ 10</p>
              </div>
            </div>

            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'Syne,sans-serif', fontSize:32, fontWeight:800, color:gradeColor }}>Grade {summary.grade}</span>
                <Badge color={summary.grade==='A'?'green':summary.grade==='B'?'amber':'red'}>
                  {summary.grade==='A'?'Excellent':summary.grade==='B'?'Good':summary.grade==='C'?'Average':'Needs Work'}
                </Badge>
              </div>
              <p style={{ color:'#9090b0', fontSize:14, lineHeight:1.6, maxWidth:480 }}>
                {summary.overallScore >= 8
                  ? 'Outstanding performance! Strong communication, relevant examples, and clear structure throughout.'
                  : summary.overallScore >= 6
                  ? 'Good performance with solid fundamentals. Polish a few areas before real interviews.'
                  : 'Keep practicing! Use the feedback below to systematically improve your interview skills.'}
              </p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10, minWidth:170 }}>
              {[
                { label:'Avg Score',  val:`${summary.overallScore}/10` },
                { label:'Best Answer',val:`Q${summary.scores.indexOf(Math.max(...summary.scores))+1} (${Math.max(...summary.scores)}/10)` },
                { label:'Questions',  val:`${summary.answeredCount} answered` },
              ].map(s => (
                <div key={s.label} style={{ display:'flex', justifyContent:'space-between', gap:16 }}>
                  <span style={{ fontSize:13, color:'#9090b0' }}>{s.label}</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ── Charts ───────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
          <Card>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, marginBottom:16 }}>📊 Performance Radar</h3>
            {summary.scores.length >= 3
              ? <canvas ref={radarRef} style={{ maxHeight:240 }}/>
              : <p style={{ color:'#9090b0', fontSize:13 }}>Need 3+ questions for radar chart.</p>}
          </Card>
          <Card>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, marginBottom:16 }}>📈 Score per Question</h3>
            <canvas ref={barRef} style={{ maxHeight:240 }}/>
          </Card>
        </div>

        {/* ── Question breakdown ──────────────────────────── */}
        <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, marginBottom:16 }}>💬 Detailed Breakdown</h3>
        {(interview.qa || []).filter(q => q.answer).map((qa, i) => {
          const ev = qa.evaluation;
          const sc = ev?.score ?? 0;
          return (
            <Card key={i} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', gap:16, alignItems:'flex-start', marginBottom:16 }}>
                {/* Score circle */}
                <div style={{
                  width:72, height:72, borderRadius:'50%', flexShrink:0,
                  border:`3px solid ${scoreColor(sc)}`,
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  background:`rgba(${sc>=7?'52,211,153':sc>=5?'251,191,36':'248,113,113'},0.06)`,
                }}>
                  <span style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, color:scoreColor(sc) }}>{sc}</span>
                  <span style={{ fontSize:10, color:'#9090b0' }}>/10</span>
                </div>

                <div style={{ flex:1 }}>
                  <p style={{ fontSize:12, color:'#9090b0', marginBottom:4 }}>Question {i+1}</p>
                  <p style={{ fontSize:15, fontWeight:500, marginBottom:10, lineHeight:1.5 }}>{qa.question}</p>
                  <div style={{ background:'#1a1a26', borderRadius:8, padding:'10px 14px' }}>
                    <p style={{ fontSize:11, color:'#9090b0', marginBottom:4 }}>Your answer:</p>
                    <p style={{ fontSize:13, lineHeight:1.65, whiteSpace:'pre-wrap' }}>{qa.answer}</p>
                  </div>
                </div>
              </div>

              {ev && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                  <div style={{ background:'rgba(52,211,153,0.07)', border:'1px solid rgba(52,211,153,0.18)', borderRadius:8, padding:'12px 14px' }}>
                    <p style={{ fontSize:11, color:'#34d399', fontWeight:700, marginBottom:6 }}>✅ Strengths</p>
                    {(ev.strengths || []).map((s,j) => <p key={j} style={{ fontSize:13, color:'#a7f3d0', marginBottom:2 }}>• {s}</p>)}
                  </div>
                  <div style={{ background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.18)', borderRadius:8, padding:'12px 14px' }}>
                    <p style={{ fontSize:11, color:'#f87171', fontWeight:700, marginBottom:6 }}>⚠ Areas to Improve</p>
                    {(ev.weaknesses || []).map((w,j) => <p key={j} style={{ fontSize:13, color:'#fca5a5', marginBottom:2 }}>• {w}</p>)}
                  </div>
                </div>
              )}
              {ev?.improved_answer && (
                <div style={{ background:'rgba(124,111,255,0.07)', border:'1px solid rgba(124,111,255,0.18)', borderRadius:8, padding:'12px 14px' }}>
                  <p style={{ fontSize:11, color:'#7c6fff', fontWeight:700, marginBottom:6 }}>💡 Improved Answer</p>
                  <p style={{ fontSize:13, color:'#c4b5fd', lineHeight:1.7 }}>{ev.improved_answer}</p>
                </div>
              )}
            </Card>
          );
        })}

        <div style={{ textAlign:'center', paddingTop:8 }}>
          <Btn variant="primary" size="lg" onClick={() => nav('/dashboard')}>🚀 Start Another Interview</Btn>
        </div>
      </div>
    </>
  );
}
