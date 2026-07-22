// src/pages/AuthPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Btn, Input, Alert, Spinner } from '../components/UI';

export default function AuthPage() {
  const [mode,     setMode]     = useState('login'); // 'login' | 'register'
  const [form,     setForm]     = useState({ name:'', email:'', password:'' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login, register }     = useAuth();
  const nav = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
        await register(form.name, form.email, form.password);
      }
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      padding:24, background:'#0a0a0f', position:'relative', overflow:'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'#7c6fff', top:-150, left:-150, filter:'blur(100px)', opacity:0.08 }}/>
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'#f472b6', bottom:-100, right:-100, filter:'blur(100px)', opacity:0.07 }}/>
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'#2dd4bf', top:'50%', right:'20%', filter:'blur(80px)', opacity:0.05 }}/>
      </div>

      {/* Card */}
      <div style={{ width:'100%', maxWidth:420, position:'relative', animation:'fadeIn 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width:64, height:64, borderRadius:18,
            background:'linear-gradient(135deg,#7c6fff,#f472b6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:30, margin:'0 auto 16px',
          }}>🤖</div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:26, marginBottom:6 }}>InterviewBot AI</h1>
          <p style={{ color:'#9090b0', fontSize:14 }}>Your personal AI interview coach</p>
        </div>

        {/* Card */}
        <div style={{
          background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:20, padding:32, boxShadow:'0 0 60px rgba(124,111,255,0.1)',
        }}>
          {/* Tab toggle */}
          <div style={{ display:'flex', gap:4, marginBottom:28, background:'#1a1a26', borderRadius:10, padding:4 }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
                flex:1, padding:'9px', fontSize:14, fontWeight:500,
                borderRadius:8, border:'none', cursor:'pointer', transition:'all 0.2s',
                background: mode===m ? '#7c6fff' : 'transparent',
                color: mode===m ? 'white' : '#9090b0',
              }}>{m === 'login' ? 'Sign In' : 'Sign Up'}</button>
            ))}
          </div>

          {error && <Alert type="error">{error}</Alert>}

          {mode === 'register' && (
            <Input label="Full Name" placeholder="Jane Smith"
              value={form.name} onChange={set('name')} autoComplete="name"/>
          )}
          <Input label="Email" type="email" placeholder="you@example.com"
            value={form.email} onChange={set('email')} autoComplete="email"/>
          <Input label="Password" type="password" placeholder="••••••••"
            value={form.password} onChange={set('password')} autoComplete="current-password"
            onKeyDown={e => e.key === 'Enter' && submit()}/>

          <Btn variant="primary" size="lg" style={{ width:'100%', marginTop:4 }}
            disabled={loading} onClick={submit}>
            {loading ? <><Spinner size={16} color="white"/> Please wait…</> :
              mode === 'login' ? '→ Sign In' : '→ Create Account'}
          </Btn>

          <p style={{ textAlign:'center', fontSize:13, color:'#5a5a80', marginTop:20 }}>
            {mode === 'login'
              ? 'Use any email & password for demo'
              : 'Free account — no credit card needed'}
          </p>
        </div>
      </div>
    </div>
  );
}
