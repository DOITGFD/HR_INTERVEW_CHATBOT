// src/pages/SettingsPage.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Card, Btn, Input, Alert, Badge, Divider, Avatar } from '../components/UI';
import { PageHeader } from '../components/Layout';

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const [name,    setName]    = useState(user?.name || '');
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState({ type:'', text:'' });
  const [pwForm,  setPwForm]  = useState({ current:'', newPw:'', confirm:'' });
  const [pwMsg,   setPwMsg]   = useState({ type:'', text:'' });

  const toast = (type, text, setter=setMsg) => { setter({type,text}); setTimeout(()=>setter({type:'',text:''}),3000); };

  const saveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { data } = await authAPI.update({ name });
      updateUser(data.user);
      toast('success', 'Name updated!');
    } catch { toast('error', 'Could not update name'); }
    finally  { setSaving(false); }
  };

  const changePw = async () => {
    if (pwForm.newPw !== pwForm.confirm) { toast('error', 'Passwords do not match', setPwMsg); return; }
    if (pwForm.newPw.length < 6)         { toast('error', 'Password must be 6+ characters', setPwMsg); return; }
    try {
      await authAPI.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwForm({ current:'', newPw:'', confirm:'' });
      toast('success', 'Password changed!', setPwMsg);
    } catch (e) { toast('error', e.response?.data?.error || 'Failed to change password', setPwMsg); }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account"/>
      <div style={{ padding:32, maxWidth:760 }}>

        {/* Profile */}
        <Card style={{ marginBottom:20 }}>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, marginBottom:20 }}>👤 Profile</h3>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
            <Avatar name={user?.name||'?'} size={60}/>
            <div>
              <p style={{ fontWeight:600, fontSize:16 }}>{user?.name}</p>
              <p style={{ fontSize:13, color:'#9090b0' }}>{user?.email}</p>
              <Badge color="purple" style={{ marginTop:6 }}>{user?.role}</Badge>
            </div>
          </div>
          {msg.text && <Alert type={msg.type}>{msg.text}</Alert>}
          <Input label="Display Name" value={name} onChange={e=>setName(e.target.value)}/>
          <Btn variant="primary" onClick={saveName} disabled={saving || name===user?.name}>
            {saving ? 'Saving…' : 'Update Name'}
          </Btn>
        </Card>

        {/* Password */}
        <Card style={{ marginBottom:20 }}>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, marginBottom:20 }}>🔑 Change Password</h3>
          {pwMsg.text && <Alert type={pwMsg.type}>{pwMsg.text}</Alert>}
          <Input label="Current Password" type="password" value={pwForm.current}
            onChange={e=>setPwForm(p=>({...p,current:e.target.value}))}/>
          <Input label="New Password" type="password" value={pwForm.newPw}
            onChange={e=>setPwForm(p=>({...p,newPw:e.target.value}))}/>
          <Input label="Confirm New Password" type="password" value={pwForm.confirm}
            onChange={e=>setPwForm(p=>({...p,confirm:e.target.value}))}/>
          <Btn variant="primary" onClick={changePw} disabled={!pwForm.current||!pwForm.newPw||!pwForm.confirm}>
            Change Password
          </Btn>
        </Card>

        {/* Account actions */}
        <Card>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, marginBottom:20 }}>⚠️ Account</h3>
          <p style={{ fontSize:13, color:'#9090b0', marginBottom:16 }}>
            Signing out will clear your session. Your history is stored in the database.
          </p>
          <Btn variant="danger" onClick={logout}>Sign Out ↩</Btn>
        </Card>
      </div>
    </>
  );
}
