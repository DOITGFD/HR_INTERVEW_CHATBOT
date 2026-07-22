// src/App.js — Root routing
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { PageLoader } from './components/UI';

// Pages
import AuthPage       from './pages/AuthPage';
import Dashboard      from './pages/Dashboard';
import InterviewPage  from './pages/InterviewPage';
import ReportPage     from './pages/ReportPage';
import HistoryPage    from './pages/HistoryPage';
import AdminPage      from './pages/AdminPage';
import SettingsPage   from './pages/SettingsPage';

// ── Protected route wrapper ───────────────────────────────────
function Protected({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader/>;
  if (!user)   return <Navigate to="/login" replace/>;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace/>;
  return children;
}

// ── With layout wrapper ───────────────────────────────────────
function WithLayout({ children }) {
  return <Layout>{children}</Layout>;
}

// ── App routes ────────────────────────────────────────────────
function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader/>;

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace/> : <AuthPage/>}/>

      {/* Protected — with sidebar layout */}
      <Route path="/dashboard" element={
        <Protected><WithLayout><Dashboard/></WithLayout></Protected>
      }/>
      <Route path="/history" element={
        <Protected><WithLayout><HistoryPage/></WithLayout></Protected>
      }/>
      <Route path="/report/:id" element={
        <Protected><WithLayout><ReportPage/></WithLayout></Protected>
      }/>
      <Route path="/settings" element={
        <Protected><WithLayout><SettingsPage/></WithLayout></Protected>
      }/>
      <Route path="/admin" element={
        <Protected adminOnly><WithLayout><AdminPage/></WithLayout></Protected>
      }/>

      {/* Interview — full screen, no sidebar */}
      <Route path="/interview/new" element={
        <Protected><InterviewPage/></Protected>
      }/>

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
      <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes/>
      </BrowserRouter>
    </AuthProvider>
  );
}
