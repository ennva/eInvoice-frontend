import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Building2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company_name: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const r = await register(form);
    setLoading(false);
    if (r.success) { toast.success('Account created!'); navigate('/dashboard'); }
    else toast.error(r.error || 'Registration failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background gradient-mesh">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8" data-testid="brand-link">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <span className="text-lg font-bold tracking-tight">EInvoicePro</span>
        </Link>

        <div className="bg-card border border-border rounded-2xl p-7 shadow-xl shadow-black/[0.04]">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Create your workspace</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Start invoicing across the EU in minutes.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="full_name" required value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} placeholder="Jane Doe" className="pl-10 h-11" data-testid="register-name-input" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="company_name" value={form.company_name} onChange={(e) => setForm({...form, company_name: e.target.value})} placeholder="Acme SAS" className="pl-10 h-11" data-testid="register-company-input" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="you@company.com" className="pl-10 h-11" data-testid="register-email-input" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={show ? 'text' : 'password'} required minLength={6} value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Minimum 6 characters" className="pl-10 pr-10 h-11" data-testid="register-password-input" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 font-semibold" data-testid="register-submit-btn">
              {loading ? 'Creating account…' : <>Create account <ArrowRight className="w-4 h-4 ml-1.5" /></>}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-5">
            By signing up you agree to our Terms & Privacy Policy.
          </p>
        </div>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline" data-testid="login-link">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
