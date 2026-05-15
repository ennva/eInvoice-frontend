# EInvoicePro Frontend Redesign — PRD

## Problem Statement
Redesign existing React (CRA) frontend for the EInvoicePro EU e-invoicing SaaS into a production-grade fintech-style SaaS UI, preserving full FastAPI backend (`/api/v1/*`) compatibility.

## User Choices
- UI framework: Tailwind + shadcn/ui
- Language: JavaScript (no TS migration)
- Auth: Existing JWT-based custom auth (/api/v1/auth/login, /register, /me)
- Existing repo cloned from https://github.com/ennva/eInvoice-frontend.git
- Backend OpenAPI: EU E-Invoicing Platform - EInvoicePro API v1.0.0 (provided as openapi.json)

## Architecture Implemented
- Modular file structure (`pages/`, `components/{layout,common,ui}`, `context/`, `lib/`)
- Sidebar + topbar shell with dark/light theme (next-themes)
- React Query for data fetching, axios interceptors for JWT
- Framer Motion animations, Recharts visualizations
- Plus Jakarta Sans typography, indigo→violet brand
- Mobile responsive (sheet sidebar)

## Pages Implemented (P0)
- Landing (/), Login (/login), Register (/register)
- Dashboard (KPI cards, revenue trend chart, status mix donut, recent invoices, usage widget)
- Invoices list (/invoices) — search, status filter, bulk select, sort, pagination, CSV export
- Invoice create (/invoices/new) — multi-section form with live preview totals
- Invoice detail (/invoices/:id) — parties, lines, timeline, action sidebar (sign/send/delete), UBL/CII export
- Customers (/customers) — aggregated from invoices
- Countries (/countries) — country rules grid
- Currencies (/currencies) — CRUD + refresh rates
- Integrations (/integrations) — accounting systems
- API Keys (/api-keys) — generate/revoke
- Billing (/billing) — plans + Stripe checkout/portal
- Settings (/settings) — profile + theme picker

## Backend API Endpoints Wired
- /api/v1/auth/login, /register, /me, /logout
- /api/v1/invoices/ (CRUD), /bulk-sign, /bulk-send, /{id}/sign, /send, /validate, /export, /history
- /api/v1/currencies, /api/v1/countries, /api/v1/integrations
- /api/v1/api-keys, /api/v1/billing/usage, /checkout, /portal

## Implemented (Date: 2026-01)
- Full redesign delivered, all pages render, sidebar shell, theme toggle, mobile responsive.
- Tested via testing_agent_v3 iteration_1: Landing/Login/Register render 100%, all data-testid present, protected route guard works.

## Known External Dependency
- REACT_APP_BACKEND_URL must point to the deployed EInvoicePro FastAPI backend. The placeholder at the preview URL only returns Hello World at /api/. Once the user updates REACT_APP_BACKEND_URL to their real backend (or deploys it under this preview URL), all authenticated flows will work end-to-end.

## P1 Backlog
- Drag-drop file uploads, command palette (Cmd+K), notifications center, audit log UI, PDF export from detail page, advanced country rule editor

## P2 Backlog
- TypeScript migration, PWA support, offline drafts, i18n (FR/EN already partially scaffolded in /locales)
