import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { api, formatCurrency } from '../lib/api';

export default function Customers() {
  const [query, setQuery] = useState('');
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices'], queryFn: async () => (await api.get('/invoices/')).data });

  const customers = useMemo(() => {
    const map = new Map();
    invoices.forEach((inv) => {
      const c = inv.customer; if (!c?.name) return;
      const key = c.vat_id || c.name;
      if (!map.has(key)) map.set(key, { ...c, invoice_count: 0, total_amount: 0 });
      const x = map.get(key);
      x.invoice_count++;
      x.total_amount += inv.payable_amount || inv.tax_inclusive_amount || 0;
    });
    let arr = Array.from(map.values());
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter((c) => (c.name || '').toLowerCase().includes(q) || (c.vat_id || '').toLowerCase().includes(q));
    }
    return arr.sort((a, b) => b.total_amount - a.total_amount);
  }, [invoices, query]);

  return (
    <div data-testid="customers-page">
      <PageHeader title="Customers" description="Customers discovered from your invoice history." />
      <Card className="mb-4 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers..." className="pl-10 h-10" data-testid="customer-search" />
        </div>
      </Card>
      <Card className="overflow-hidden">
        {isLoading ? <div className="h-64 animate-shimmer bg-muted" /> : customers.length === 0 ? (
          <EmptyState icon={Users} title="No customers yet" description="Once you create invoices, your customers will appear here." testId="customers-empty" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border"><tr className="text-left text-xs uppercase text-muted-foreground"><th className="px-4 py-3">Customer</th><th className="px-4 py-3">VAT ID</th><th className="px-4 py-3">Country</th><th className="px-4 py-3 text-right">Invoices</th><th className="px-4 py-3 text-right">Total</th></tr></thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors" data-testid={`customer-row-${i}`}>
                  <td className="px-4 py-3"><p className="font-medium">{c.name}</p>{c.contact_email && <p className="text-xs text-muted-foreground">{c.contact_email}</p>}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{c.vat_id || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.address?.country_code || '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.invoice_count}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatCurrency(c.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
