# Placement Portal Frontend

React + TypeScript + Tailwind CSS frontend for the Placement Portal security system.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## Architecture

### Phase 1: Foundation ✓
- React + TypeScript + Vite
- React Router for navigation
- JWT authentication with token persistence
- Protected routes with role-based access
- Tailwind CSS with professional color system
- API client with request/response interceptors

### Phase 2: Student Dashboard (In Progress)
- Student profile view with integrity status
- Profile edit with auto-signing
- Re-sign functionality
- My Applications list
- Tamper notifications with polling

### Phases 3-5
- Company dashboard
- Placement admin dashboard
- Audit logs and TPA results
- Professional styling and polish

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS + PostCSS
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Layout.tsx
│   ├── IntegrityBadge.tsx
│   └── ...
├── pages/           # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   └── ...
├── services/        # API integration
│   └── api.ts
├── context/         # React context
│   └── AuthContext.tsx
├── utils/           # Utilities
│   └── ProtectedRoute.tsx
├── styles/          # Global styles
│   └── index.css
├── App.tsx          # App routing
└── main.tsx         # React DOM entry
```

## Authentication Flow

1. User logs in via email + password
2. Backend returns JWT token
3. Token stored in localStorage
4. Token automatically added to all API requests via interceptor
5. 401 responses trigger logout + redirect to login

## Demo Credentials

- **Admin**: admin@portal.com / admin
- **Student**: naman.demo.2026@gmail.com / dev
- **Company**: company@techcorp.com / company123
