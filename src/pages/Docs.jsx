import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, ArrowLeft, ArrowRight, KeyRound, Network, Archive, ShieldCheck,
  Landmark, Globe2, BookOpen, FileCheck2, Terminal, ChevronRight, CheckCircle2, Clock, AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { API } from '../lib/api';

const ENDPOINTS = [
  { method: 'POST', path: '/api/v1/api-keys', desc: 'Create a sandbox or production API key; the secret is returned once.' },
  { method: 'POST', path: '/api/v1/validate', desc: 'Validate XML before creating or submitting an invoice.' },
  { method: 'POST', path: '/api/v1/invoices/', desc: 'Create a draft invoice with UBL or CII format preference.' },
  { method: 'POST', path: '/api/v1/invoices/{id}/validate', desc: 'Run EN 16931 validation and persist validation_result.' },
  { method: 'POST', path: '/api/v1/invoices/{id}/sign', desc: 'Apply a digital signature to the invoice payload.' },
  { method: 'POST', path: '/api/v1/invoices/{id}/send', desc: 'Submit through Storecove / Peppol after validation.' },
  { method: 'GET',  path: '/api/v1/invoices/{guid}/status', desc: 'Poll lifecycle status by delivery GUID.' },
  { method: 'GET',  path: '/api/v1/invoices/{guid}/download', desc: 'Get signed XML or PDF archive download URLs.' },
  { method: 'GET',  path: '/api/v1/countries/', desc: 'List supported EU countries and their compliance rules.' },
];

const STATUSES = [
  { key: 'draft', desc: 'Initial state after creation, not yet validated' },
  { key: 'validated', desc: 'Passed EN 16931 and country-specific rules' },
  { key: 'invalid', desc: 'Failed validation — see validation_result' },
  { key: 'submitted', desc: 'Sent to Peppol network, awaiting acknowledgement' },
  { key: 'delivered', desc: 'Acknowledged by the recipient access point' },
  { key: 'rejected', desc: 'Recipient or network rejected the invoice' },
  { key: 'paid', desc: 'Payment recorded' },
  { key: 'archived', desc: 'Stored in immutable archive with retention metadata' },
];

const NAV_SECTIONS = [
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'api', label: 'API reference' },
  { id: 'statuses', label: 'Lifecycle statuses' },
  { id: 'countries', label: 'Country guide' },
  { id: 'compliance-roadmap', label: 'Compliance roadmap' },
];

export default function Docs({ focus = 'overview' }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (focus === 'roadmap') {
      const el = document.getElementById('compliance-roadmap');
      if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [focus]);

  return (
    <div className="min-h-screen bg-background" data-testid="docs-page">
      {/* Header */}
      <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5" data-testid="docs-brand-link">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.4} />
              </div>
              <span className="text-base font-bold tracking-tight">EInvoicePro</span>
            </Link>
            <Badge variant="outline" className="hidden sm:inline-flex"><BookOpen className="w-3 h-3 mr-1" /> Docs</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} data-testid="docs-back-btn"><ArrowLeft className="w-4 h-4 mr-1.5" /> Home</Button>
            <Button size="sm" onClick={() => navigate('/register')} className="bg-primary hover:bg-primary/90" data-testid="docs-register-btn">Get started <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
          {/* Sidebar TOC */}
          <aside className="lg:sticky lg:top-24 self-start">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Contents</p>
            <nav className="space-y-1">
              {NAV_SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" data-testid={`toc-${s.id}`}>
                  {s.label}
                </a>
              ))}
            </nav>
            <div className="mt-6 p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-2">Base URL</p>
              <code className="text-xs font-mono break-all block text-foreground">{API}</code>
            </div>
          </aside>

          {/* Content */}
          <main className="space-y-10 min-w-0">
            <section>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900"><CheckCircle2 className="w-3 h-3 mr-1" /> EN 16931 validated</Badge>
                <Badge className="bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900"><Network className="w-3 h-3 mr-1" /> Peppol-connected</Badge>
                <Badge className="bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900"><Landmark className="w-3 h-3 mr-1" /> PA compliance in progress</Badge>
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Developer documentation</h1>
              <p className="text-lg text-muted-foreground mt-3 max-w-3xl">Everything you need to send compliant e-invoices across the EU — REST API, country rules, lifecycle statuses, and the EInvoicePro compliance roadmap.</p>
            </section>

            <section id="quickstart" className="scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight mb-4">Quickstart</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { I: KeyRound, title: '1. Create an API key', desc: 'Generate a sandbox key in the dashboard. The secret is shown once.' },
                  { I: FileCheck2, title: '2. Validate XML', desc: 'POST your invoice XML to /validate before submission.' },
                  { I: Network, title: '3. Submit & deliver', desc: 'Create the invoice and call /send to route through Peppol.' },
                ].map(({ I, title, desc }) => (
                  <div key={title} className="rounded-lg border border-border p-5 bg-card">
                    <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-3"><I className="w-4 h-4" /></div>
                    <p className="font-semibold mb-1">{title}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>

              <Card className="mt-4 overflow-hidden">
                <CardHeader className="bg-muted/40 border-b border-border py-3"><CardTitle className="text-sm flex items-center gap-2 font-mono"><Terminal className="w-4 h-4" /> Example flow</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <pre className="text-xs font-mono bg-slate-950 text-slate-100 p-5 overflow-x-auto leading-relaxed">{`# 1. Create API key (dashboard token)
curl -X POST ${API}/api-keys \\
  -H "Authorization: Bearer <user-jwt>" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Sandbox key"}'

# 2. Validate XML
curl -X POST ${API}/validate \\
  -H "Authorization: Bearer einv_test_xxx" \\
  -H "Content-Type: application/xml" \\
  --data-binary @invoice.xml

# 3. Create invoice + send via Peppol
INVOICE_ID=$(curl -s -X POST ${API}/invoices/ \\
  -H "Authorization: Bearer einv_test_xxx" \\
  -d @invoice.json | jq -r .id)

curl -X POST ${API}/invoices/$INVOICE_ID/send \\
  -H "Authorization: Bearer einv_test_xxx"`}</pre>
                </CardContent>
              </Card>
            </section>

            <section id="authentication" className="scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight mb-4">Authentication</h2>
              <Card>
                <CardContent className="pt-6 text-sm space-y-3">
                  <p>EInvoicePro uses <strong>HTTP Bearer authentication</strong>. Two token types are supported:</p>
                  <ul className="space-y-2 ml-5 list-disc text-muted-foreground">
                    <li><strong className="text-foreground">User JWT</strong> — obtained from <code className="bg-muted px-1 rounded">POST /api/v1/auth/login</code>. Used by the dashboard.</li>
                    <li><strong className="text-foreground">API key secret</strong> — generated in the dashboard at <code className="bg-muted px-1 rounded">/api-keys</code>. Long-lived, scoped, rate-limited.</li>
                  </ul>
                  <p className="pt-2">Always send <code className="bg-muted px-1 rounded">Authorization: Bearer &lt;token&gt;</code>. Revoke API keys you no longer need from the dashboard.</p>
                </CardContent>
              </Card>
            </section>

            <section id="api" className="scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight mb-4">API reference</h2>
              <Card>
                <CardContent className="divide-y divide-border p-0">
                  {ENDPOINTS.map((e) => (
                    <div key={e.method + e.path} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 hover:bg-muted/30 transition-colors" data-testid={`endpoint-${e.path.replace(/[^a-z0-9]/gi, '-')}`}>
                      <Badge variant="outline" className={`w-fit font-mono ${e.method === 'GET' ? 'text-emerald-700 border-emerald-300 dark:text-emerald-300 dark:border-emerald-900' : 'text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-900'}`}>{e.method}</Badge>
                      <code className="font-mono text-sm font-medium">{e.path}</code>
                      <span className="text-sm text-muted-foreground sm:ml-auto">{e.desc}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <section id="statuses" className="scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight mb-4">Lifecycle statuses</h2>
              <Card>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STATUSES.map((s) => (
                    <div key={s.key} className="flex items-start gap-3 p-3 rounded-md border border-border bg-card">
                      <Badge variant="secondary" className="capitalize font-mono text-xs">{s.key}</Badge>
                      <p className="text-sm text-muted-foreground flex-1">{s.desc}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <section id="countries" className="scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight mb-4">Country guide</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Landmark className="w-4 h-4 text-primary" /> France (FR)</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Peppol scheme <code className="bg-muted px-1 rounded">0009</code> (SIRET). VAT ID required when applicable.</p>
                    <p>B2G routing through Chorus Pro. B2B reform expected from 2026.</p>
                    <p>Supported formats: UBL 2.1, CII D16B, Factur-X (all profiles).</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Landmark className="w-4 h-4 text-primary" /> Luxembourg (LU)</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Peppol schemes <code className="bg-muted px-1 rounded">9952</code> or <code className="bg-muted px-1 rounded">9938</code> (LU VAT).</p>
                    <p>B2G routing through Guichet.lu paths.</p>
                    <p>EN 16931-compliant via Storecove access point.</p>
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe2 className="w-4 h-4 text-primary" /> Other supported countries</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>Germany (DE) · Italy (IT) · Spain (ES) · Netherlands (NL) · Belgium (BE) · Austria (AT) · Portugal (PT) — all EN 16931-compliant via Peppol. Country-specific mandatory fields are exposed at <code className="bg-muted px-1 rounded">GET /api/v1/countries/required-fields</code>.</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section id="compliance-roadmap" className={`scroll-mt-24 ${focus === 'roadmap' ? 'ring-2 ring-primary/30 rounded-xl p-1' : ''}`} data-testid="compliance-roadmap-section">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Compliance roadmap</h2>
              <p className="text-sm text-muted-foreground mb-5">Transparent view of where EInvoicePro stands on certifications, partnerships, and regulatory milestones.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-emerald-200 dark:border-emerald-900">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" /> Available now</div>
                    <CardTitle className="text-base">Production ready</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>EN 16931 validation, Peppol-connected delivery, Storecove partner routing.</p>
                    <p>API keys, immutable invoice archive URLs, signature workflow.</p>
                  </CardContent>
                </Card>
                <Card className="border-amber-200 dark:border-amber-900">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider"><Clock className="w-3.5 h-3.5" /> In progress</div>
                    <CardTitle className="text-base">Coming this quarter</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Solution Compatible registration and PA immatriculation for the French 2026 e-invoicing reform.</p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider"><AlertCircle className="w-3.5 h-3.5" /> Not claimed</div>
                    <CardTitle className="text-base">Transparency</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>EInvoicePro does not claim DGFiP PA approval today. Messaging is intentionally limited to Peppol-connected and EN 16931-compliant capabilities.</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 grid-pattern opacity-[0.08] pointer-events-none" />
              <div className="relative max-w-2xl">
                <h3 className="text-2xl font-bold tracking-tight">Ready to integrate?</h3>
                <p className="text-white/80 mt-2 mb-5">Create a free sandbox key in seconds. No credit card required.</p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => navigate('/register')} className="bg-white text-indigo-700 hover:bg-white/90 font-semibold" data-testid="docs-cta-register">Create workspace <ChevronRight className="w-4 h-4 ml-1" /></Button>
                  <Button variant="outline" onClick={() => navigate('/login')} className="border-white/30 text-white hover:bg-white/10" data-testid="docs-cta-login">Sign in</Button>
                </div>
              </div>
            </section>
          </main>
        </motion.div>
      </div>
    </div>
  );
}
