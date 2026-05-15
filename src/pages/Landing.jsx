import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Globe2, Zap, Network, Landmark, FileCheck2, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';

const FEATURES = [
  { icon: ShieldCheck, title: 'EN 16931 validation', desc: 'Real-time rule-based checks at every step' },
  { icon: Network, title: 'Peppol-connected', desc: 'B2G & B2B delivery via Storecove network' },
  { icon: Landmark, title: 'Chorus Pro & Guichet.lu', desc: 'Native B2G routing for FR & LU public sector' },
  { icon: FileCheck2, title: 'UBL · CII · Factur-X', desc: 'All EN 16931 formats supported out of the box' },
  { icon: Globe2, title: '9 EU countries', desc: 'FR, DE, IT, ES, NL, LU, BE, AT, PT — and growing' },
  { icon: Zap, title: 'Bulk operations', desc: 'Sign and dispatch hundreds of invoices at once' },
];

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-indigo-50/40 via-transparent to-transparent dark:from-indigo-900/10 pointer-events-none" />

      <header className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <span className="text-base font-bold tracking-tight">EInvoicePro</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/docs')} data-testid="header-docs-btn" className="px-2 sm:px-3">
            <BookOpen className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Docs</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')} data-testid="header-login-btn" className="px-2 sm:px-3">Sign in</Button>
          <Button size="sm" onClick={() => navigate('/register')} data-testid="header-register-btn" className="bg-primary hover:bg-primary/90 px-3 sm:px-4">
            <span className="hidden xs:inline">Get started</span>
            <span className="xs:hidden">Start</span>
            <ArrowRight className="w-4 h-4 ml-1 sm:ml-1.5" />
          </Button>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 lg:pt-24 pb-20">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 backdrop-blur-sm text-xs font-medium text-muted-foreground mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              EU Directive 2014/55/EU · Now supporting Peppol network
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-balance">
              E-invoicing for finance teams, <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">built for Europe.</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-2xl">
              Generate, validate, sign and route compliant e-invoices across 9 EU countries — in any EN 16931 format. From draft to delivery in seconds.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Button size="lg" onClick={() => navigate('/register')} className="bg-primary hover:bg-primary/90 h-12 px-6 text-sm font-semibold" data-testid="hero-cta-register">
                Start free <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="h-12 px-6 text-sm font-semibold" data-testid="hero-cta-login">
                Sign in
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-muted-foreground">
              {['No credit card', 'Sandbox API', 'EN 16931 validated', 'Peppol-ready'].map((t) => (
                <div key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" />{t}</div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-10 lg:p-14 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 grid-pattern opacity-[0.08]" />
            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">Ready to ship your first compliant invoice?</h2>
              <p className="text-white/80 max-w-xl mx-auto mb-7">Join finance teams across Europe automating e-invoicing with EInvoicePro.</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" onClick={() => navigate('/register')} className="bg-white text-indigo-700 hover:bg-white/90 h-12 px-7 font-semibold" data-testid="cta-bottom-register">
                  Create your workspace <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/docs')} className="h-12 px-7 font-semibold bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white backdrop-blur-sm" data-testid="cta-bottom-docs">
                  <BookOpen className="w-4 h-4 mr-1.5" /> Read the docs
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} EInvoicePro</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/docs" className="hover:text-foreground transition-colors" data-testid="footer-docs-link">Docs</Link>
            <Link to="/docs/compliance-roadmap" className="hover:text-foreground transition-colors" data-testid="footer-roadmap-link">Compliance roadmap</Link>
            <span>EU Directive 2014/55/EU · EN 16931 · Peppol-connected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
