import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight, ShieldCheck, Globe2, Zap } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const r = await login(email, password);
    setLoading(false);
    if (r.success) { toast.success('Welcome back!'); navigate('/dashboard'); }
    else toast.error(r.error || 'Login failed');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Form */}
      <div className="flex-1 flex flex-col px-6 sm:px-12 lg:px-20 py-8 lg:py-12">
        <Link to="/" className="inline-flex items-center gap-2.5 group w-fit" data-testid="brand-link">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <span className="text-base font-bold tracking-tight">EInvoicePro</span>
        </Link>

        <div className="flex-1 flex items-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Sign in to your workspace</h1>
              <p className="text-sm text-muted-foreground mt-2">Manage invoices, validate compliance, and dispatch via Peppol in one place.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email" type="email" required autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="pl-10 h-11"
                    data-testid="email-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs text-primary hover:underline" data-testid="forgot-password-link">Forgot password?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password" type={show ? 'text' : 'password'} required autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11"
                    data-testid="password-input"
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" data-testid="toggle-password-visibility" aria-label="Toggle password visibility">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 rounded border-border accent-primary" data-testid="remember-me-checkbox" />
                Keep me signed in
              </label>

              <Button type="submit" disabled={loading} className="w-full h-11 text-sm font-semibold" data-testid="login-submit-btn">
                {loading ? 'Signing in…' : <>Sign in <ArrowRight className="w-4 h-4 ml-1.5" /></>}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground mt-6 text-center">
              New here? <Link to="/register" className="text-primary font-medium hover:underline" data-testid="register-link">Create an account</Link>
            </p>
          </motion.div>
        </div>

        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} EInvoicePro — EU Directive 2014/55/EU compliant</p>
      </div>

      {/* Right: Visual */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-900 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-[0.07]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-cyan-500/10" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-2 text-sm font-medium text-white/70">
            <ShieldCheck className="w-4 h-4" /> Peppol-connected · EN 16931 compliant
          </div>

          <div className="space-y-8 max-w-md">
            <div>
              <h2 className="text-4xl font-bold tracking-tight leading-tight">
                Invoice with <span className="bg-gradient-to-r from-cyan-200 to-white bg-clip-text text-transparent">confidence</span> across Europe.
              </h2>
              <p className="text-white/70 mt-4 text-base">From UBL to Factur-X, from Chorus Pro to Guichet.lu — the unified e-invoicing layer for finance teams.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: ShieldCheck, title: 'EN 16931 validation', desc: 'Real-time rule-based checks' },
                { icon: Globe2, title: 'Peppol routing', desc: 'B2G & B2B delivery, 9 EU countries' },
                { icon: Zap, title: 'Bulk sign & send', desc: 'Process hundreds of invoices at once' },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0"><f.icon className="w-4 h-4" /></div>
                  <div>
                    <p className="font-semibold text-sm">{f.title}</p>
                    <p className="text-xs text-white/60">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-white/50">
            <span>FR · LU · DE · IT · ES · NL · BE · AT · PT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
