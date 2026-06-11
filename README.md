# Crisis Copilot 🚨

> AI-Powered Emergency Response Platform — Bridging communication gaps when every second counts.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![Gemini](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?logo=google)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss)

## Executive Summary

**Crisis Copilot** is a hackathon project designed to revolutionize emergency response. Leveraging the **Gemini multimodal AI engine**, the platform bridges communication gaps during crises by analyzing images, assessing visual threats, translating foreign languages, and converting chaotic emergency data into structured, actionable insights for dispatchers.

## ✨ Core Features

### 🔴 Victim App (Mobile)
- **Panic Snap**: One-tap emergency photo + audio capture
- **Geolocation**: Automatic location detection
- **Zero-Minute First Aid**: AI-generated safety instructions delivered instantly
- **Missing Persons**: Dedicated form with AI entity extraction

### 🔵 Dispatcher Dashboard (Desktop)
- **Kanban Board**: Real-time prioritized emergency tickets
- **Activity Feed**: Live timeline of all emergency events
- **Search & Filter**: Find emergencies quickly
- **Manual Dispatch**: Deploy police, fire, ambulance, or search & rescue
- **Status Management**: Update ticket status through the workflow

### 🧠 AI Capabilities (Gemini)
- **Multimodal Triage**: Analyze images + text simultaneously for threat assessment
- **Language Translation**: Detect and translate 50+ languages in real-time
- **Auto Dispatch**: Automatically deploy units for severity 4-5 emergencies
- **Entity Extraction**: Parse photos for age, clothing, distinguishing features
- **Structured Output**: Generate standardized JSON for missing person reports

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Framer Motion |
| Styling | Tailwind CSS 4 |
| Backend | Node.js, Express 5 |
| AI Engine | Google Gemini 2.0 Flash |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime (emergencies + dispatched_units) with polling fallback |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project
- A Google Gemini API key

### 1. Clone & Install

```bash
git clone https://github.com/Y-Udayanga/Beacon-version-2.git
cd Beacon-version-2
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
```

### 3. Database Setup

Run the SQL schema in your Supabase SQL Editor:

```bash
# Copy contents of supabase-schema.sql into Supabase SQL Editor and run
```

### 4. Start Development

```bash
# Terminal 1: Start the backend server
npm run server

# Terminal 2: Start the frontend dev server
npm run dev
```

The app will be available at `http://localhost:5173` with the API proxied to `http://localhost:3001`.

## 📁 Project Structure

```
├── index.html              # Entry HTML with SEO meta tags
├── server/                 # Express.js backend
│   ├── index.js            # Server entry point
│   ├── config/env.js       # Environment configuration
│   ├── middleware/upload.js # Multer file upload
│   ├── routes/
│   │   ├── emergency.js    # Emergency report + triage
│   │   ├── emergencies.js  # Emergency CRUD
│   │   ├── dispatch.js     # Manual dispatch
│   │   └── missingPerson.js# Missing person reports
│   └── services/
│       ├── gemini.js       # Gemini AI integration
│       ├── supabase.js     # Database operations
│       └── dispatch.js     # Auto-dispatch logic
├── src/                    # React frontend
│   ├── App.tsx             # Router & layout
│   ├── index.css           # Tailwind theme & utilities
│   ├── pages/
│   │   ├── Landing.tsx     # Landing page
│   │   ├── VictimApp.tsx   # Mobile victim interface
│   │   ├── DispatcherDashboard.tsx # Desktop dashboard
│   │   └── MissingPersonReport.tsx # Missing person form
│   ├── components/
│   │   ├── landing/        # Landing page components
│   │   ├── dispatcher/     # Dashboard components
│   │   ├── victim/         # Victim app components
│   │   └── shared/         # Shared components
│   ├── hooks/              # Custom React hooks
│   │   ├── useEmergencies.ts  # Realtime + polling emergency data
│   │   ├── useGeolocation.ts  # Browser geolocation
│   │   └── useMediaCapture.ts # Camera + mic capture
│   └── lib/
│       ├── api.ts          # API client
│       ├── supabase.ts     # Supabase client
│       └── utils.ts        # Utility functions
└── supabase-schema.sql     # Database schema
```

## 🗄️ Database Schema

- **emergencies** — Core emergency records with severity, category, location, and AI assessments
- **missing_persons** — Missing person reports with AI-extracted tags
- **dispatched_units** — Deployed emergency service units
- **dispatch_log** — Audit trail of all dispatch actions (AI and human)

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emergency/report` | Submit new emergency (multipart) |
| POST | `/api/emergency/:id/triage` | Re-run AI triage |
| GET | `/api/emergencies` | List all emergencies |
| GET | `/api/emergencies/activity` | Recent dispatch activity log |
| PATCH | `/api/emergencies/:id` | Update emergency |
| POST | `/api/dispatch` | Manually dispatch unit |
| GET | `/api/missing-person` | List missing person reports |
| PATCH | `/api/missing-person/:id` | Update missing person status |
| POST | `/api/missing-person` | Submit missing person report |
| POST | `/api/missing-person/extract` | Extract tags from photo |
| GET | `/api/health` | Health check |

## Realtime Updates

The dispatcher and volunteer dashboards subscribe to Supabase Realtime on the `emergencies` and `dispatched_units` tables. When Realtime is connected, updates appear instantly; if the connection drops, the app falls back to polling every 5 seconds (with a 30-second backup poll while Realtime is active).

Ensure Realtime is enabled in your Supabase project and that the schema publication includes these tables (see `supabase-schema.sql`).

## 🤝 Team

Built with ❤️ for the 20-hour hackathon challenge.

## 📄 License

MIT
