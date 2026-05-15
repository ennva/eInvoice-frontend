# EInvoicePro Frontend Redesign — PRD

## Problem Statement
Redesign existing React (CRA) frontend for the EInvoicePro EU e-invoicing SaaS into a production-grade fintech-style SaaS UI, preserving full FastAPI backend (`/api/v1/*`) compatibility.

## User Choices
- UI framework: Tailwind + shadcn/ui
- Language: JavaScript (no TS migration)
- Auth: Existing JWT-based custom auth (`/api/v1/auth/login`, `/register`, `/me`)
- Existing repo cloned from https://github.com/ennva/eInvoice-frontend.git
- Backend OpenAPI provided by user (openapi.json). Real backend not deployed, so a mock FastAPI backend was scaffolded under `/app/backend/server.py` matching every endpoint in the openapi spec.

## Architecture Implemented
- Modular FE file structure (`pages/`, `components/{layout,common,ui}`, `context/`, `lib/`)
- Sidebar + topbar shell with dark/light theme (next-themes) and EN/FR i18n toggle
- React Query for data fetching, axios interceptors for JWT
- Framer Motion animations, Recharts visualizations
- Plus Jakarta Sans typography, indigo→violet brand
- Mobile responsive (sheet sidebar)
- Cmd+K / Ctrl+K Command Palette
- Print-to-PDF on invoice detail (print CSS hides sidebar/topbar)

## Backend (mock, matches openapi.json)
- FastAPI + Motor (MongoDB), JWT bearer (HS256)
- Endpoints: auth (register/login/me/logout), invoices CRUD + bulk-sign + bulk-send + sign + send + validate + export + history, currencies CRUD + refresh-rates, countries (9 EU) + required-fields, api-keys, billing usage/checkout/portal, integrations
- Tested by pytest: 16/16 passing
- Currencies seeded on first call (EUR base, USD, GBP, CHF)

## Pages Implemented
- Landing, Login (split-screen, password toggle, remember-me), Register
- Dashboard (KPI cards, revenue line chart, status donut, recent invoices, usage)
- Invoices list (search, status filter, sort, bulk select+sign+send, CSV export, pagination)
- Invoice create (multi-section form, live preview totals)
- Invoice detail (parties, lines, timeline, action sidebar with Sign/Send/Delete, Print/PDF + UBL + CII + Validate)
- Customers (aggregated from invoices)
- Countries (9 EU rules)
- Currencies (CRUD + refresh rates)
- Integrations (accounting systems)
- API Keys (generate one-time secret, revoke)
- Billing (3 plans + Stripe-style checkout/portal)
- Settings (profile + theme picker)

## What's been implemented (2026-01)
- Iter 1: Full redesign + modular architecture. Landing/Login/Register all rendered correctly; blocker = real backend missing.
- Iter 2: Mock FastAPI backend scaffolded matching openapi.json + Command Palette + PDF print + EN/FR i18n toggle. Full E2E verified by testing agent: 100% backend pass, 95% frontend pass (only minor cosmetic notes addressed).

## Test credentials
See `/app/memory/test_credentials.md`. Demo user: `demo@example.com` / `Demo1234!`.

## P1 Backlog
- Replace native date inputs with shadcn Calendar/DatePicker for locale-consistent UX
- Drag-drop file uploads for attaching documents to invoices
- Notifications center (real-time toasts feed)
- Audit log UI (use `/invoices/{id}/history` endpoint)
- Real PDF generation server-side (using e.g. weasyprint) instead of browser print

## P2 Backlog
- TypeScript migration, PWA support, offline drafts, command palette fuzzy search across more entities
- Real Stripe billing wiring, real Storecove/Peppol routing
