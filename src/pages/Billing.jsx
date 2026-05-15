import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Check, Sparkles } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { api, getErrorMessage } from '../lib/api';
import { toast } from 'sonner';

const PLANS = [
  { code: 'starter', name: 'Starter', price: '€0', desc: 'For individuals testing the platform', features: ['10 invoices/month', 'EN 16931 validation', 'UBL & CII exports'] },
  { code: 'pro', name: 'Pro', price: '€29', desc: 'For growing businesses', features: ['500 invoices/month', 'Peppol routing', 'All EU countries', 'API access', 'Bulk operations'], popular: true },
  { code: 'enterprise', name: 'Enterprise', price: 'Custom', desc: 'For finance teams at scale', features: ['Unlimited invoices', 'Custom integrations', 'SLA & priority support', 'Dedicated CSM'] },
];

export default function Billing() {
  const { data: usage } = useQuery({ queryKey: ['billing-usage'], queryFn: async () => (await api.get('/billing/usage')).data, retry: false });

  const upgrade = async (plan) => {
    try { const r = await api.post(`/billing/checkout?plan=${plan}`); if (r.data.checkout_url) window.location.href = r.data.checkout_url; }
    catch (e) { toast.error(getErrorMessage(e)); }
  };
  const portal = async () => {
    try { const r = await api.post('/billing/portal'); if (r.data.portal_url) window.location.href = r.data.portal_url; }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div data-testid="billing-page">
      <PageHeader title="Billing" description="Manage your subscription and usage." actions={<Button variant="outline" onClick={portal} data-testid="manage-portal-btn">Open billing portal</Button>} />
      {usage && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div><CardTitle className="text-base">Current plan: <span className="capitalize">{usage.plan || 'Starter'}</span></CardTitle><CardDescription>Resets monthly</CardDescription></div>
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm mb-2"><span className="text-muted-foreground">Invoices used</span><span className="font-semibold tabular-nums">{usage.invoices_used ?? 0} / {usage.invoices_limit ?? '∞'}</span></div>
            <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${Math.min(100, ((usage.invoices_used ?? 0) / (usage.invoices_limit || 100)) * 100)}%` }} /></div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <Card key={p.code} className={p.popular ? 'border-primary ring-2 ring-primary/20 relative' : ''} data-testid={`plan-${p.code}`}>
            {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full inline-flex items-center gap-1"><Sparkles className="w-3 h-3" /> Popular</div>}
            <CardHeader>
              <CardTitle className="text-lg">{p.name}</CardTitle>
              <div className="flex items-baseline gap-1.5"><span className="text-3xl font-bold">{p.price}</span>{p.price !== 'Custom' && <span className="text-sm text-muted-foreground">/mo</span>}</div>
              <CardDescription>{p.desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {p.features.map((f) => <div key={f} className="flex items-start gap-2 text-sm"><Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /><span>{f}</span></div>)}
              <Button onClick={() => upgrade(p.code)} className={`w-full mt-4 ${p.popular ? 'bg-primary hover:bg-primary/90' : ''}`} variant={p.popular ? 'default' : 'outline'} data-testid={`upgrade-${p.code}-btn`}>{p.code === 'enterprise' ? 'Contact sales' : 'Choose plan'}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
