import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Download, Plus, FileText, Trash2, Eye, Send, ShieldCheck, ChevronDown, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { api, formatCurrency, formatDate, getErrorMessage } from '../lib/api';
import { toast } from 'sonner';
import { INVOICE_STATUSES } from '../lib/utils';

const fetchInvoices = async () => (await api.get('/invoices/')).data;

export default function InvoiceList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [sort, setSort] = useState({ key: 'issue_date', dir: 'desc' });
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices'], queryFn: fetchInvoices });

  const filtered = useMemo(() => {
    let arr = invoices;
    if (status !== 'all') arr = arr.filter((i) => i.status === status);
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter((i) =>
        (i.invoice_number || '').toLowerCase().includes(q) ||
        (i.customer?.name || '').toLowerCase().includes(q) ||
        (i.supplier?.name || '').toLowerCase().includes(q)
      );
    }
    arr = [...arr].sort((a, b) => {
      const av = a[sort.key]; const bv = b[sort.key];
      const r = av > bv ? 1 : av < bv ? -1 : 0;
      return sort.dir === 'asc' ? r : -r;
    });
    return arr;
  }, [invoices, status, query, sort]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  const toggleAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((i) => i.id)));
  };
  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/invoices/${id}`),
    onSuccess: () => { toast.success('Invoice deleted'); qc.invalidateQueries({ queryKey: ['invoices'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const bulkSign = useMutation({
    mutationFn: (ids) => api.post('/invoices/bulk-sign', ids),
    onSuccess: (r) => { toast.success(`Signed ${r.data.successful}/${r.data.total} invoices`); qc.invalidateQueries({ queryKey: ['invoices'] }); setSelected(new Set()); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const bulkSend = useMutation({
    mutationFn: (ids) => api.post('/invoices/bulk-send', ids),
    onSuccess: (r) => { toast.success(`Sent ${r.data.successful ?? r.data.results?.length}/${r.data.results?.length || 0} invoices`); qc.invalidateQueries({ queryKey: ['invoices'] }); setSelected(new Set()); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const exportCsv = () => {
    const rows = [['Invoice', 'Customer', 'Issue Date', 'Due Date', 'Amount', 'Currency', 'Status']];
    filtered.forEach((i) => rows.push([
      i.invoice_number, i.customer?.name || '', i.issue_date, i.due_date || '',
      i.payable_amount || i.tax_inclusive_amount || 0, i.currency_code || 'EUR', i.status,
    ]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'invoices.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const sortHeader = (key, label) => (
    <button onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1 hover:text-foreground">
      {label}<ChevronDown className={`w-3.5 h-3.5 transition-transform ${sort.key === key && sort.dir === 'asc' ? 'rotate-180' : ''} ${sort.key === key ? 'text-foreground' : 'text-muted-foreground/50'}`} />
    </button>
  );

  return (
    <div data-testid="invoices-page">
      <PageHeader
        title="Invoices"
        description="Search, filter, and manage your e-invoices."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} data-testid="export-csv-btn"><Download className="w-4 h-4 mr-1.5" /> Export</Button>
            <Button onClick={() => navigate('/invoices/new')} className="bg-primary hover:bg-primary/90" data-testid="new-invoice-btn"><Plus className="w-4 h-4 mr-1.5" /> New Invoice</Button>
          </>
        }
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search by invoice number or customer..." className="pl-10 h-10" data-testid="search-input" />
            {query && (<button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>)}
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-48 h-10" data-testid="status-filter"><Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {INVOICE_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {selected.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 py-2 rounded-lg bg-primary/5 border border-primary/20">
            <span className="text-sm font-medium" data-testid="bulk-selection-count">{selected.size} selected</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => bulkSign.mutate([...selected])} disabled={bulkSign.isPending} data-testid="bulk-sign-btn"><ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Sign</Button>
              <Button size="sm" variant="outline" onClick={() => bulkSend.mutate([...selected])} disabled={bulkSend.isPending} data-testid="bulk-send-btn"><Send className="w-3.5 h-3.5 mr-1.5" /> Send</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border sticky top-0 backdrop-blur-sm">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 w-10"><Checkbox checked={paged.length > 0 && selected.size === paged.length} onCheckedChange={toggleAll} data-testid="select-all-checkbox" /></th>
                <th className="px-4 py-3 font-semibold">{sortHeader('invoice_number', 'Invoice')}</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">{sortHeader('issue_date', 'Issue date')}</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold text-right">{sortHeader('payable_amount', 'Amount')}</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={8} className="px-4 py-3"><div className="h-8 rounded animate-shimmer bg-muted" /></td>
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr><td colSpan={8}>
                  <EmptyState icon={FileText} title={query || status !== 'all' ? 'No invoices match your filters' : 'No invoices yet'} description={query || status !== 'all' ? 'Try changing your search or filter.' : 'Create your first compliant e-invoice.'} action={!query && status === 'all' ? (<Button onClick={() => navigate('/invoices/new')} data-testid="empty-create-btn"><Plus className="w-4 h-4 mr-1.5" /> Create invoice</Button>) : null} testId="invoices-empty" />
                </td></tr>
              ) : (
                paged.map((inv) => (
                  <tr key={inv.id} className="border-b border-border hover:bg-muted/30 transition-colors group" data-testid={`invoice-row-${inv.id}`}>
                    <td className="px-4 py-3"><Checkbox checked={selected.has(inv.id)} onCheckedChange={() => toggleOne(inv.id)} data-testid={`select-${inv.id}`} /></td>
                    <td className="px-4 py-3"><button onClick={() => navigate(`/invoices/${inv.id}`)} className="font-medium text-foreground hover:text-primary text-left" data-testid={`invoice-link-${inv.id}`}>{inv.invoice_number}</button></td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{inv.customer?.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.issue_date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatCurrency(inv.payable_amount || inv.tax_inclusive_amount, inv.currency_code)}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-opacity" data-testid={`row-actions-${inv.id}`}>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/invoices/${inv.id}`)}><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/invoices/${inv.id}?edit=1`)}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { if (confirm('Delete this invoice?')) deleteMutation.mutate(inv.id); }} className="text-destructive focus:text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > PER_PAGE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
            <span className="text-muted-foreground">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)} data-testid="prev-page">Previous</Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)} data-testid="next-page">Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
