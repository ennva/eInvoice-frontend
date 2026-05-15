import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, CheckCircle2, Clock, Send, Plus, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { api, formatCurrency, formatDate } from '../lib/api';

const fetchInvoices = async () => (await api.get('/invoices/')).data;
const fetchUsage = async () => (await api.get('/billing/usage')).data;

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices'], queryFn: fetchInvoices });
  const { data: usage } = useQuery({ queryKey: ['billing-usage'], queryFn: fetchUsage, retry: false });

  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter((i) => i.status === 'paid' || i.payment_status === 'paid').length;
    const sentSet = new Set(['submitted', 'delivered', 'sent']);
    const sent = invoices.filter((i) => sentSet.has(i.status)).length;
    const drafts = invoices.filter((i) => i.status === 'draft').length;
    const overdue = invoices.filter((i) => i.due_date && new Date(i.due_date) < new Date() && i.payment_status !== 'paid' && i.status !== 'paid').length;
    const revenue = invoices.filter((i) => i.status === 'paid' || i.payment_status === 'paid').reduce((s, i) => s + (i.payable_amount || i.tax_inclusive_amount || 0), 0);
    const pending = invoices.filter((i) => i.status !== 'paid' && i.payment_status !== 'paid' && i.status !== 'draft').reduce((s, i) => s + (i.payable_amount || i.tax_inclusive_amount || 0), 0);
    return { total, paid, sent, drafts, overdue, revenue, pending };
  }, [invoices]);

  const monthly = useMemo(() => {
    const map = new Map();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = d.toLocaleString('en', { month: 'short' });
      map.set(k, { month: k, count: 0, revenue: 0 });
    }
    invoices.forEach((inv) => {
      const d = new Date(inv.issue_date || inv.created_at);
      const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
      if (diff >= 0 && diff < 6) {
        const k = d.toLocaleString('en', { month: 'short' });
        if (map.has(k)) {
          const e = map.get(k);
          e.count++;
          e.revenue += inv.payable_amount || inv.tax_inclusive_amount || 0;
        }
      }
    });
    return Array.from(map.values());
  }, [invoices]);

  const statusDist = useMemo(() => {
    const groups = { Paid: 0, Sent: 0, Validated: 0, Draft: 0, Invalid: 0 };
    invoices.forEach((i) => {
      if (i.status === 'paid' || i.payment_status === 'paid') groups.Paid++;
      else if (['submitted','delivered','sent'].includes(i.status)) groups.Sent++;
      else if (i.status === 'validated') groups.Validated++;
      else if (i.status === 'invalid' || i.status === 'rejected') groups.Invalid++;
      else groups.Draft++;
    });
    const colors = ['#7c3aed', '#3b82f6', '#10b981', '#94a3b8', '#ef4444'];
    return Object.entries(groups).map(([name, value], i) => ({ name, value, fill: colors[i] }));
  }, [invoices]);

  const recent = invoices.slice(0, 6);

  return (
    <div data-testid="dashboard-page">
      <PageHeader
        title="Dashboard"
        description="Overview of your invoicing activity, compliance and revenue."
        actions={
          <Button onClick={() => navigate('/invoices/new')} className="bg-primary hover:bg-primary/90" data-testid="dashboard-new-invoice-btn">
            <Plus className="w-4 h-4 mr-1.5" /> New Invoice
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total revenue" value={formatCurrency(stats.revenue)} icon={CheckCircle2} accent="success" sub="Paid invoices" testId="stat-revenue" />
        <StatCard label="Pending" value={formatCurrency(stats.pending)} icon={Clock} accent="warning" sub={`${stats.sent + stats.drafts} open invoices`} testId="stat-pending" />
        <StatCard label="Total invoices" value={stats.total} icon={FileText} accent="primary" sub={`${stats.drafts} drafts`} testId="stat-total" />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} accent="info" sub="Need follow-up" testId="stat-overdue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue trend</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(238 75% 56%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(238 75% 56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(238 75% 56%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(238 75% 56%)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status mix</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] min-h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDist} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {statusDist.map((entry, idx) => (<Cell key={idx} fill={entry.fill} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {statusDist.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.fill }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto font-medium tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Recent invoices</CardTitle>
              <CardDescription>Your latest activity</CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/invoices')} data-testid="view-all-invoices-btn">View all <ArrowUpRight className="w-3.5 h-3.5 ml-1" /></Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3,4].map((i) => <div key={i} className="h-14 rounded-lg animate-shimmer bg-muted" />)}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState icon={FileText} title="No invoices yet" description="Create your first compliant invoice to see activity here." action={
                <Button onClick={() => navigate('/invoices/new')} data-testid="empty-create-invoice-btn"><Plus className="w-4 h-4 mr-1.5" /> Create invoice</Button>
              } testId="dashboard-empty" />
            ) : (
              <div className="divide-y divide-border -mx-2">
                {recent.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    className="w-full flex items-center gap-3 px-2 py-3 hover:bg-muted/50 rounded-lg transition-colors text-left"
                    data-testid={`recent-invoice-${inv.id}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{inv.customer?.name || '—'} · {formatDate(inv.issue_date)}</p>
                    </div>
                    <div className="text-sm font-semibold tabular-nums">{formatCurrency(inv.payable_amount || inv.tax_inclusive_amount, inv.currency_code)}</div>
                    <StatusBadge status={inv.status} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Usage</CardTitle>
            <CardDescription>{usage?.plan ? `Plan: ${usage.plan}` : 'Plan info'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Invoices used</span>
                <span className="font-medium tabular-nums">{usage?.invoices_used ?? stats.total} / {usage?.invoices_limit ?? '∞'}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${Math.min(100, ((usage?.invoices_used ?? stats.total) / (usage?.invoices_limit || 100)) * 100)}%` }} />
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate('/billing')} data-testid="view-billing-btn">Manage subscription</Button>
            <div className="pt-3 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium">{stats.paid}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sent</span><span className="font-medium">{stats.sent}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Drafts</span><span className="font-medium">{stats.drafts}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
