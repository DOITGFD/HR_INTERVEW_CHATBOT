// src/services/api.js — Centralized API service using axios
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE });

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ib_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — logout and redirect
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ib_token');
      localStorage.removeItem('ib_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  register: (data)   => api.post('/auth/register', data),
  login:    (data)   => api.post('/auth/login', data),
  me:       ()       => api.get('/auth/me'),
  update:   (data)   => api.put('/auth/update', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Interview ─────────────────────────────────────────────────
export const interviewAPI = {
  start:   (data)                 => api.post('/interview/start', data),
  answer:  (id, data)             => api.post(`/interview/${id}/answer`, data),
  abandon: (id)                   => api.post(`/interview/${id}/abandon`),
  getOne:  (id)                   => api.get(`/interview/${id}`),
  list:    (params)               => api.get('/interview', { params }),
  remove:  (id)                   => api.delete(`/interview/${id}`),
};

// ── Reports ───────────────────────────────────────────────────
export const reportAPI = {
  get:     (id) => api.get(`/report/${id}`),
  stats:   ()   => api.get('/report/stats/me'),
  pdfUrl:  (id) => {
    const token = localStorage.getItem('ib_token');
    return `${BASE}/report/${id}/pdf?token=${token}`;
  },
};

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  stats:           ()     => api.get('/admin/stats'),
  users:           (p)    => api.get('/admin/users', { params: p }),
  updateRole:      (id,r) => api.put(`/admin/users/${id}/role`, { role: r }),
  questions:       (p)    => api.get('/admin/questions', { params: p }),
  addQuestion:     (d)    => api.post('/admin/questions', d),
  updateQuestion:  (id,d) => api.put(`/admin/questions/${id}`, d),
  deleteQuestion:  (id)   => api.delete(`/admin/questions/${id}`),
  allInterviews:   (p)    => api.get('/admin/interviews', { params: p }),
};

export default api;
