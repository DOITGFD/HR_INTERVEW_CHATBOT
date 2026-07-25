// src/pages/InterviewPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Btn, Spinner, ProgressBar } from '../components/UI';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/themes/prism-tomorrow.css';

const DOMAINS = {
  hr:'HR Behavioral', technical:'Technical', coding:'Coding Round', custom:'Custom',
};

// ── Timer ring component ──────────────────────────────────────
function TimerRing({ seconds, total, onExpire }) {
  const [left, setLeft] = useState(seconds);
  const ref = useRef();
  useEffect(() => {
    setLeft(seconds);
    ref.current = setInterval(() => setLeft(p => {
      if (p <= 1) { clearInterval(ref.current); onExpire?.(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(ref.current);
  }, [seconds]); // eslint-disable-line

  const pct   = left / total;
  const r     = 22;
  const circ  = 2 * Math.PI * r;
  const color = pct > 0.5 ? '#34d399' : pct > 0.25 ? '#fbbf24' : '#f87171';
  const mins  = Math.floor(left / 60);
  const secs  = String(left % 60).padStart(2,'0');

  return (
    <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center', width:56, height:56 }}>
      <svg width="56" height="56" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
          style={{ transition:'stroke-dashoffset 1s linear, stroke 0.5s' }}/>
      </svg>
      <div style={{ position:'absolute', textAlign:'center' }}>
        <p style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, color }}>{mins}:{secs}</p>
      </div>
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display:'flex', gap:5, alignItems:'center', padding:'14px 18px' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:8, height:8, borderRadius:'50%', background:'#7c6fff',
          animation:`typingDot 1s ${i*0.2}s infinite`,
        }}/>
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────
function Msg({ role, content, user }) {
  const isUser = role === 'user';
  return (
    <div style={{ display:'flex', gap:12, maxWidth:'82%', ...(isUser && { marginLeft:'auto', flexDirection:'row-reverse' }), animation:'fadeIn 0.25s ease' }}>
      <div style={{
        width:36, height:36, borderRadius:'50%', flexShrink:0,
        background: isUser ? 'linear-gradient(135deg,#2dd4bf,#34d399)' : 'linear-gradient(135deg,#7c6fff,#f472b6)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontWeight:700, fontSize:14, color:'white',
      }}>{isUser ? user?.name?.[0]?.toUpperCase() : '🤖'}</div>
      <div>
        <div style={{
          padding:'13px 17px', borderRadius:18, fontSize:14, lineHeight:1.65,
          background: isUser ? 'rgba(124,111,255,0.18)' : '#1a1a26',
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius:  isUser ? 18 : 4,
          whiteSpace:'pre-wrap',
          wordBreak: 'break-word'
        }}>{content}</div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function InterviewPage() {
  const location  = useLocation();
  const nav       = useNavigate();
  const { user }  = useAuth();
  const config    = location.state || { domain:'hr', difficulty:'Medium', customTopic:'' };

  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [phase,        setPhase]        = useState('loading'); // loading|questioning|done
  const [qIndex,       setQIndex]       = useState(0);
  const [totalQ,       setTotalQ]       = useState(5);
  const [interviewId,  setInterviewId]  = useState(null);
  const [timerKey,     setTimerKey]     = useState(0);
  const [timerSecs,    setTimerSecs]    = useState(120);
  const [isRecording,  setIsRecording]  = useState(false);
  const [qStartTime,   setQStartTime]   = useState(Date.now());

  // Coding environment state
  const isCoding = config.domain === 'coding';
  const [code, setCode] = useState('// Write your code here\n');
  const [language, setLanguage] = useState('javascript');
  const [codeOutput, setCodeOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const scrollRef   = useRef();
  const recRef      = useRef();
  const domainLabel = config.domain === 'custom' ? config.customTopic : DOMAINS[config.domain];
  const TIME_MAP    = isCoding 
    ? { Easy: 600, Medium: 1200, Hard: 1800 } 
    : { Easy: 90, Medium: 120, Hard: 180 };

  const push = useCallback((role, content) => {
    setMessages(m => [...m, { role, content }]);
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 80);
  }, []);

  // Start interview on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await interviewAPI.start({
          domain:      config.domain,
          difficulty:  config.difficulty,
          customTopic: config.customTopic || '',
        });
        setInterviewId(data.interviewId);
        setTotalQ(data.totalQuestions);
        setTimerSecs(TIME_MAP[config.difficulty] || 120);
        push('assistant', data.message);
        setPhase('questioning');
        setQStartTime(Date.now());
      } catch (err) {
        push('assistant', `Hello ${user?.name}! Let's begin your ${domainLabel} interview.\n\nQuestion 1: Tell me about yourself and your relevant experience.`);
        setPhase('questioning');
      }
    })();
  }, []); // eslint-disable-line

  const submitAnswer = async (answerText) => {
    if ((!answerText.trim() && !isCoding) || loading || phase === 'done') return;
    
    let displayAnswer = answerText.trim();
    if (isCoding && code.trim() && code !== '// Write your code here\n') {
      displayAnswer += (displayAnswer ? '\n\n' : '') + `\`\`\`${language}\n${code}\n\`\`\``;
    }
    
    if (!displayAnswer) return;

    const timeSpent = Math.round((Date.now() - qStartTime) / 1000);
    setInput('');
    push('user', displayAnswer);
    setLoading(true);

    try {
      const { data } = await interviewAPI.answer(interviewId, {
        answer: displayAnswer,
        questionIndex: qIndex,
        timeSpent,
      });

      if (data.isComplete) {
        push('assistant', data.closing || 'Great work! Your interview is complete. Generating your report…');
        setPhase('done');
        setTimeout(() => nav(`/report/${interviewId}`), 2500);
      } else {
        push('assistant', data.nextQuestion);
        setQIndex(i => i + 1);
        setTimerKey(k => k + 1);
        setQStartTime(Date.now());
        setCode('// Write your code here\n');
        setCodeOutput('');
      }
    } catch {
      push('assistant', 'Sorry, there was an issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const executeCode = async () => {
    setIsExecuting(true);
    setCodeOutput('Running...\n');
    try {
      const { data } = await interviewAPI.executeCode({ language, code });
      if (data.stderr) {
        setCodeOutput(`Error:\n${data.stderr}`);
      } else {
        setCodeOutput(data.stdout || 'Program exited with no output.');
      }
    } catch (err) {
      setCodeOutput('Execution failed. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  };

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported. Please type your answer.'); return; }
    if (isRecording) { recRef.current?.stop(); setIsRecording(false); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = e => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setInput(t);
    };
    rec.onend = () => setIsRecording(false);
    rec.start();
    recRef.current = rec;
    setIsRecording(true);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(input); }
  };

  const getPrismLanguage = (lang) => {
    switch (lang) {
      case 'javascript': return languages.js;
      case 'python': return languages.python;
      case 'java': return languages.java;
      case 'cpp': return languages.cpp;
      default: return languages.js;
    }
  };

  const pct = Math.round(((qIndex) / totalQ) * 100);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#0a0a0f' }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)',
        background:'#0a0a0f', flexShrink:0, gap:16,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:36, height:36, borderRadius:9,
            background:'rgba(124,111,255,0.15)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
          }}>🤖</div>
          <div>
            <p style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14 }}>{domainLabel} Interview</p>
            <p style={{ fontSize:12, color:'#9090b0' }}>{config.difficulty} · Q{Math.min(qIndex+1, totalQ)} of {totalQ}</p>
          </div>
        </div>

        <div style={{ flex:1, maxWidth:300 }}>
          <ProgressBar value={qIndex} max={totalQ}/>
          <p style={{ fontSize:11, color:'#9090b0', textAlign:'right', marginTop:4 }}>{pct}% complete</p>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {phase === 'questioning' && (
            <TimerRing key={timerKey} seconds={timerSecs} total={timerSecs}
              onExpire={() => (input.trim() || isCoding) && submitAnswer(input)}/>
          )}
          <Btn variant="secondary" size="sm" onClick={() => nav('/dashboard')}>✕ End</Btn>
        </div>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        
        {/* ── Left Side: Chat Area ─────────────────────────────── */}
        <div style={{
          flex:1, display:'flex', flexDirection:'column',
          borderRight: isCoding ? '1px solid rgba(255,255,255,0.08)' : 'none'
        }}>
          {/* Messages */}
          <div ref={scrollRef} style={{
            flex:1, overflowY:'auto', padding:'24px',
            display:'flex', flexDirection:'column', gap:16,
          }}>
            {phase === 'loading' && (
              <div style={{ display:'flex', justifyContent:'center', paddingTop:60, flexDirection:'column', alignItems:'center', gap:12 }}>
                <Spinner size={32}/><p style={{ color:'#9090b0' }}>Starting your interview…</p>
              </div>
            )}
            {messages.map((m, i) => <Msg key={i} role={m.role} content={m.content} user={user}/>)}
            {loading && (
              <div style={{ display:'flex', gap:12 }}>
                <div style={{
                  width:36, height:36, borderRadius:'50%', flexShrink:0,
                  background:'linear-gradient(135deg,#7c6fff,#f472b6)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>🤖</div>
                <div style={{ background:'#1a1a26', borderRadius:18, borderBottomLeftRadius:4 }}>
                  <TypingDots/>
                </div>
              </div>
            )}
            {phase === 'done' && (
              <p style={{ textAlign:'center', color:'#34d399', fontSize:14, padding:16 }}>
                ✅ Interview complete! Redirecting to your report…
              </p>
            )}
          </div>

          {/* Input area */}
          <div style={{
            padding:'14px 24px', borderTop:'1px solid rgba(255,255,255,0.08)',
            background:'#0a0a0f', flexShrink:0,
          }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading || phase !== 'questioning'}
                placeholder={phase === 'loading' ? 'Starting interview…' : phase === 'done' ? 'Interview complete' : isCoding ? 'Type explanation here...' : 'Type your answer… (Enter to send, Shift+Enter for new line)'}
                rows={2}
                style={{
                  flex:1, background:'#1a1a26', border:'1px solid rgba(255,255,255,0.15)',
                  borderRadius:12, color:'#f0f0ff', padding:'12px 16px', fontSize:14,
                  fontFamily:'DM Sans,sans-serif', resize:'none', outline:'none',
                  maxHeight:120, lineHeight:1.5, transition:'border-color 0.2s',
                }}/>

              {/* Voice button */}
              <button onClick={toggleVoice} disabled={phase !== 'questioning'}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
                style={{
                  width:46, height:46, borderRadius:'50%', border:'none', cursor:'pointer',
                  fontSize:18, display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.2s', flexShrink:0,
                  background: isRecording ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.06)',
                  color: isRecording ? '#f87171' : '#9090b0',
                  animation: isRecording ? 'pulse 1s infinite' : 'none',
                }}>
                {isRecording ? '⏹' : '🎤'}
              </button>

              {/* Send */}
              <Btn variant="primary" style={{ height:46, padding:'0 20px', flexShrink:0 }}
                onClick={() => submitAnswer(input)}
                disabled={loading || phase !== 'questioning' || (!input.trim() && !isCoding)}>
                {loading ? <Spinner size={16} color="white"/> : 'Send →'}
              </Btn>
            </div>

            <p style={{ fontSize:11, color:'#5a5a80', textAlign:'center', marginTop:8 }}>
              {isCoding ? 'Submit code & explanation when ready' : 'Enter to submit · Shift+Enter for new line · 🎤 voice input'}
            </p>
          </div>
        </div>

        {/* ── Right Side: Code Editor (Coding Domain Only) ──────── */}
        {isCoding && (
          <div style={{ width:'50%', display:'flex', flexDirection:'column', background:'#12121a' }}>
            
            {/* Editor Toolbar */}
            <div style={{ 
              display:'flex', alignItems:'center', justifyContent:'space-between', 
              padding:'12px 20px', background:'#1a1a26', borderBottom:'1px solid rgba(255,255,255,0.08)' 
            }}>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.1)', color: '#fff', 
                  border: 'none', padding: '6px 12px', borderRadius: '6px', 
                  outline: 'none', fontFamily: 'inherit', fontSize: '13px'
                }}
                disabled={loading || phase !== 'questioning'}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>

              <Btn 
                variant="secondary" 
                size="sm" 
                onClick={executeCode} 
                disabled={isExecuting || loading || phase !== 'questioning'}
                style={{ background: '#2dd4bf', color: '#000', border: 'none' }}
              >
                {isExecuting ? 'Running...' : '▶ Run Code'}
              </Btn>
            </div>

            {/* Code Editor */}
            <div style={{ flex: 2, overflowY: 'auto', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <Editor
                value={code}
                onValueChange={code => setCode(code)}
                highlight={code => highlight(code, getPrismLanguage(language), language)}
                padding={20}
                disabled={loading || phase !== 'questioning'}
                style={{
                  fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                  fontSize: 14,
                  minHeight: '100%',
                  background: '#12121a',
                  color: '#fff'
                }}
              />
            </div>

            {/* Output Console */}
            <div style={{ flex: 1, display:'flex', flexDirection:'column', background:'#0a0a0f' }}>
              <div style={{ padding:'8px 16px', background:'#16161f', fontSize:12, color:'#9090b0', textTransform:'uppercase', fontWeight:700, letterSpacing:1 }}>
                Output Console
              </div>
              <div style={{ flex:1, padding:16, overflowY:'auto', fontFamily:'monospace', fontSize:13, color:'#f0f0ff', whiteSpace:'pre-wrap' }}>
                {codeOutput || 'Run your code to see the output here.'}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
