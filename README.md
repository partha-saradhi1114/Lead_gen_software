# LeadGen Pro · Full-Stack Platform

A decoupled full-stack application built with **React 19**, **JavaScript**, **Tailwind CSS**, **Node.js**, and **Express.js**.

---

## 📁 Project Structure

```text
screenshot-to-scene-7549 (1)/
├── frontend/                     # React + JavaScript + Tailwind CSS
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── components/           # UI components (.jsx)
│   │   │   ├── bde/              # BDE pipeline, stage badges & update modals
│   │   │   ├── dashboard/        # KPI cards, charts, lead review tables
│   │   │   ├── layout/           # AppHeader, AppSidebar, navigation
│   │   │   ├── ra/               # Research analyst & upload wizard
│   │   │   ├── common/           # DataTable, Pager, Panel, Toolbar
│   │   │   └── ui/               # Radix / Tailwind buttons, tables, dialogs
│   │   ├── routes/               # Page views (.jsx)
│   │   │   ├── login.jsx         # Persona-based authentication
│   │   │   ├── bde.*.jsx         # BDE workspaces (leads, credits, follow-ups)
│   │   │   ├── ra.*.jsx          # RA workspaces (upload, status, reports)
│   │   │   └── index.jsx         # Master Admin operations dashboard
│   │   ├── lib/
│   │   │   ├── api.js            # REST API client connecting to Express backend
│   │   │   ├── leadgen/          # Context store, reducer, formatters
│   │   │   └── utils.js          # Styling utilities
│   │   ├── main.jsx              # React DOM entry point
│   │   ├── router.jsx            # Client routing configuration
│   │   └── styles.css            # Tailwind theme tokens
│   ├── index.html                # Vite HTML entry point
│   ├── package.json
│   ├── vite.config.js
│   ├── vitest.config.js
│   └── jsconfig.json
│
├── backend/                      # Node.js + Express.js REST API
│   ├── src/
│   │   ├── models/               # Data store & seed engine (.js)
│   │   ├── services/             # Lead, BDE & team business logic (.js)
│   │   ├── routes/               # Express API endpoints (/api/...) (.js)
│   │   └── server.js             # Express app entry point (port 5000)
│   └── package.json
│
└── package.json                  # Root runner orchestrating both services
```

---

## 🚀 Running the Project

### 1. Run Both (Frontend & Backend) Concurrently
From the project root:
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000` (Healthcheck: `http://localhost:5000/api/health`)

---

### 2. Run Independently

#### Run Backend Server:
```bash
npm run dev:backend
```
*(or `cd backend && npm run dev`)*

#### Run Frontend Client:
```bash
npm run dev:frontend
```
*(or `cd frontend && npm run dev`)*

---

### 3. Build & Test

```bash
npm run build   # Builds production frontend
npm test        # Runs Vitest unit & integration test suite
```
