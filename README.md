# 🤖 AI Interview Bot — Full Stack

> A production-ready AI-powered interview simulator with real backend, MongoDB, JWT auth, and Claude AI integration.

---

## 📁 Project Structure

```
ai-interview-bot/
│
├── package.json                  ← Root (concurrently run both)
│
├── backend/                      ← Node.js + Express API
│   ├── server.js                 ← Entry point
│   ├── package.json
│   ├── .env.example
│   ├── routes/
│   │   ├── auth.js               ← Register, login, JWT
│   │   ├── interview.js          ← Start, answer, abandon
│   │   ├── report.js             ← Reports, PDF, stats
│   │   └── admin.js              ← Users, questions, analytics
│   ├── models/
│   │   ├── User.js               ← bcrypt, JWT, roles
│   │   ├── Interview.js          ← Q&A + evaluations
│   │   └── Question.js           ← Admin question bank
│   ├── middleware/
│   │   └── auth.js               ← protect, adminOnly
│   ├── services/
│   │   └── aiService.js          ← All Claude AI calls
│   └── config/
│       └── seed.js               ← Seed admin + questions
│
└── frontend/                     ← React SPA
    ├── package.json
    ├── .env                      ← REACT_APP_API_URL
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js              ← React entry
        ├── index.css             ← Global styles + CSS vars
        ├── App.js                ← Router + auth guards
        ├── context/
        │   └── AuthContext.js    ← Global user state
        ├── services/
        │   └── api.js            ← Axios + all API calls
        ├── components/
        │   ├── UI.js             ← Btn, Card, Badge, Input…
        │   └── Layout.js         ← Sidebar + PageHeader
        └── pages/
            ├── AuthPage.js       ← Login / Register
            ├── Dashboard.js      ← Home + start interview
            ├── InterviewPage.js  ← Chat UI + timer + voice
            ├── ReportPage.js     ← Scores, charts, feedback
            ├── HistoryPage.js    ← Past sessions + trend
            ├── AdminPage.js      ← Admin panel
            └── SettingsPage.js   ← Profile + password
```

---

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- Node.js 18+
- MongoDB Atlas free account → https://cloud.mongodb.com
- Anthropic API key → https://console.anthropic.com

---

### Step 1 — Clone & Install

```bash
git clone <your-repo-url>
cd ai-interview-bot

# Install root concurrently tool
npm install

# Install backend
cd backend && npm install && cd ..

# Install frontend
cd frontend && npm install && cd ..
```

---

### Step 2 — Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# From MongoDB Atlas
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/interview-bot?retryWrites=true&w=majority

# Generate: node -e "require('crypto').randomBytes(64).toString('hex')"
JWT_SECRET=your_64_char_random_secret_here
JWT_EXPIRES_IN=7d

# From https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxx
```

---

### Step 3 — Seed Database (optional but recommended)

```bash
cd backend
npm run seed
# Creates: admin@interviewbot.ai / Admin@123
# Seeds: 18 sample questions across all domains
```

---

### Step 4 — Run Development Servers

```bash
# From root — starts both backend + frontend simultaneously
npm run dev

# Or separately:
cd backend  && npm run dev   # → http://localhost:5000
cd frontend && npm start     # → http://localhost:3000
```

---

## 📡 Full API Reference

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{name, email, password}` | Create account → JWT |
| POST | `/api/auth/login` | `{email, password}` | Login → JWT |
| GET | `/api/auth/me` | — | Get current user (auth required) |
| PUT | `/api/auth/update` | `{name}` | Update profile |
| PUT | `/api/auth/change-password` | `{currentPassword, newPassword}` | Change password |

### Interview

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/interview/start` | `{domain, difficulty, customTopic?}` | Start session, get first question |
| POST | `/api/interview/:id/answer` | `{answer, questionIndex, timeSpent}` | Submit answer, get evaluation + next Q |
| POST | `/api/interview/:id/abandon` | — | Mark as abandoned |
| GET | `/api/interview` | `?domain&difficulty&page&limit` | List user's interviews |
| GET | `/api/interview/:id` | — | Get full session |
| DELETE | `/api/interview/:id` | — | Delete session |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/report/stats/me` | User stats: avg score, by domain, trend |
| GET | `/api/report/:id` | Full interview report with evaluations |
| GET | `/api/report/:id/pdf` | Download PDF report |

### Admin (admin role required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform analytics |
| GET | `/api/admin/users` | All users `?search&page&limit` |
| PUT | `/api/admin/users/:id/role` | Change user role |
| GET | `/api/admin/questions` | Question bank `?domain&difficulty` |
| POST | `/api/admin/questions` | Add question `{text, domain, difficulty, tags}` |
| PUT | `/api/admin/questions/:id` | Edit question |
| DELETE | `/api/admin/questions/:id` | Delete question |
| GET | `/api/admin/interviews` | All platform interviews |

---

## 🧠 AI Prompt Architecture

Each domain has a tailored system prompt:

```
HR:        Senior HR Business Partner — STAR method, behavioral, cultural fit
Technical: Staff Engineer — system design, scalability, CS fundamentals  
Coding:    Senior SWE — DSA, complexity, clean code, edge cases
Custom:    Expert in [topic] — domain-specific questions
```

**Evaluation JSON schema** (returned per answer):
```json
{
  "score": 8,
  "strengths": ["Used STAR format", "Quantified impact"],
  "weaknesses": ["Could add follow-up action"],
  "improved_answer": "A stronger version would...",
  "summary": "Good response with structured delivery."
}
```

---

## 🔒 Security

- Passwords: bcrypt with 12 rounds
- Auth: JWT with expiry (7d default)
- Rate limiting: 200 req / 15 min per IP
- Helmet: HTTP security headers
- CORS: Scoped to `FRONTEND_URL`
- Input validation: `express-validator` on all POST routes
- `select: false` on password field in MongoDB

---

## 🛣 Deployment

### Backend → Railway / Render

```bash
# Set these env vars in your dashboard:
PORT, MONGO_URI, JWT_SECRET, ANTHROPIC_API_KEY, FRONTEND_URL, NODE_ENV=production
```

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --production
COPY backend/ .
EXPOSE 5000
CMD ["node", "server.js"]
```

### Frontend → Vercel / Netlify

```bash
cd frontend
npm run build
# Upload the build/ folder
# Set env: REACT_APP_API_URL=https://your-backend-url.com/api
```

### .env for production frontend
```env
REACT_APP_API_URL=https://api.your-domain.com/api
```

---

## 🎨 UI Design System

| Token | Value |
|-------|-------|
| Background | `#0a0a0f` |
| Surface | `#111118` / `#1a1a26` |
| Accent | `#7c6fff` |
| Success | `#34d399` |
| Warning | `#fbbf24` |
| Error | `#f87171` |
| Font | Syne (headings) + DM Sans (body) |

---

## 📈 Resume-Worthy Highlights

- **AI/LLM Integration**: Prompt engineering with Claude — domain-specific, structured JSON evaluation
- **Full-stack REST API**: Express + MongoDB with proper error handling, validation, rate limiting
- **React SPA**: Context API, React Router v6, axios interceptors, protected routes
- **Data Visualization**: Chart.js radar + line charts for performance analytics
- **Voice Input**: Web Speech API browser integration
- **PDF Generation**: Server-side PDFKit reports
- **Security**: bcrypt, JWT, Helmet, rate limiting, input validation
- **Admin Panel**: User management, question bank, platform analytics
- **Clean Architecture**: Separated concerns (routes/models/services/middleware)

---

## 📄 License

MIT
