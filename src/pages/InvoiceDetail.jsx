import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Send, ShieldCheck, CheckCircle2, Trash2, Clock, FileDown, Printer } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { api, formatCurrency, formatDate, formatDateTime, getErrorMessage } from '../lib/api';
import { toast } from 'sonner';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: invoice, isLoading } = useQuery({ queryKey: ['invoice', id], queryFn: async () => (await api.get(`/invoices/${id}`)).data });
  const { data: history = [] } = useQuery({ queryKey: ['invoice-history', id], queryFn: async () => (await api.get(`/invoices/${id}/history`)).data, retry: false });

  const validate = useMutation({
    mutationFn: () => api.post(`/invoices/${id}/validate`),
    onSuccess: () => { toast.success('Validation complete'); qc.invalidateQueries({ queryKey: ['invoice', id] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const sign = useMutation({
    mutationFn: () => api.post(`/invoices/${id}/sign`),
    onSuccess: () => { toast.success('Invoice signed'); qc.invalidateQueries({ queryKey: ['invoice', id] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const send = useMutation({
    mutationFn: () => api.post(`/invoices/${id}/send`, {}),
    onSuccess: () => { toast.success('Invoice sent'); qc.invalidateQueries({ queryKey: ['invoice', id] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`/invoices/${id}`),
    onSuccess: () => { toast.success('Invoice deleted'); navigate('/invoices'); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const exportFormat = async (fmt) => {
    try {
      const r = await api.get(`/invoices/${id}/export/${fmt}`, { responseType: 'text' });
      const blob = new Blob([r.data], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${invoice.invoice_number}_${fmt}.xml`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${fmt.toUpperCase()}`);
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const printPdf = () => {
    window.print();
    toast.info('Use "Save as PDF" in the print dialog');
  };

  if (isLoading || !invoice) return <div className="h-96 rounded-xl animate-shimmer bg-muted" />;

  return (
    <div data-testid="invoice-detail-page">
      <PageHeader
        breadcrumb={<button onClick={() => navigate('/invoices')} className="hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Invoices</button>}
        title={invoice.invoice_number}
        description={<span className="inline-flex items-center gap-2"><StatusBadge status={invoice.status} />{invoice.signature_status && invoice.signature_status !== 'unsigned' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900"><ShieldCheck className="w-3.5 h-3.5" /> Signed</span>}</span>}
        actions={
          <>
            <Button variant="outline" onClick={printPdf} data-testid="export-pdf-btn"><Printer className="w-4 h-4 mr-1.5" /> Print / PDF</Button>
            <Button variant="outline" onClick={() => exportFormat('ubl')} data-testid="export-ubl-btn"><Download className="w-4 h-4 mr-1.5" /> UBL</Button>
            <Button variant="outline" onClick={() => exportFormat('cii')} data-testid="export-cii-btn"><Download className="w-4 h-4 mr-1.5" /> CII</Button>
            <Button variant="outline" onClick={() => validate.mutate()} disabled={validate.isPending} data-testid="validate-btn"><CheckCircle2 className="w-4 h-4 mr-1.5" /> Validate</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Parties</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              {['supplier', 'customer'].map((k) => (
                <div key={k}>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{k}</p>
                  <p className="font-semibold text-base">{invoice[k]?.name || '—'}</p>
                  {invoice[k]?.address && (
                    <p className="text-muted-foreground mt-1">{invoice[k].address.street_name}<br />{invoice[k].address.postal_code} {invoice[k].address.city_name}<br />{invoice[k].address.country_code}</p>
                  )}
                  {invoice[k]?.vat_id && <p className="text-xs text-muted-foreground mt-2">VAT: {invoice[k].vat_id}</p>}
                  {invoice[k]?.peppol_id && <p className="text-xs text-muted-foreground">Peppol: {invoice[k].peppol_id}</p>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Line items</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-muted-foreground border-b border-border"><th className="py-2">Item</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Price</th><th className="py-2 text-right">VAT</th><th className="py-2 text-right">Total</th></tr></thead>
                <tbody>
                  {(invoice.invoice_lines || []).map((l, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-3"><p className="font-medium">{l.item_name}</p>{l.item_description && <p className="text-xs text-muted-foreground">{l.item_description}</p>}</td>
                      <td className="py-3 text-right tabular-nums">{l.quantity}</td>
                      <td className="py-3 text-right tabular-nums">{formatCurrency(l.price_amount, invoice.currency_code)}</td>
                      <td className="py-3 text-right">{l.tax_category?.percent}%</td>
                      <td className="py-3 text-right font-semibold tabular-nums">{formatCurrency(l.line_extension_amount, invoice.currency_code)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 pt-4 border-t border-border space-y-1.5 max-w-xs ml-auto text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(invoice.tax_exclusive_amount, invoice.currency_code)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>VAT</span><span className="tabular-nums">{formatCurrency(invoice.tax_amount, invoice.currency_code)}</span></div>
                <div className="flex justify-between font-bold text-base pt-1.5 border-t border-border"><span>Total</span><span className="tabular-nums" data-testid="invoice-total">{formatCurrency(invoice.payable_amount, invoice.currency_code)}</span></div>
              </div>
            </CardContent>
          </Card>

          {invoice.note && (
            <Card><CardHeader><CardTitle className="text-base">Note</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{invoice.note}</CardContent></Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => sign.mutate()} disabled={sign.isPending} className="w-full justify-start" variant="outline" data-testid="sign-btn"><ShieldCheck className="w-4 h-4 mr-2" /> Sign invoice</Button>
              <Button onClick={() => send.mutate()} disabled={send.isPending} className="w-full justify-start bg-primary hover:bg-primary/90" data-testid="send-btn"><Send className="w-4 h-4 mr-2" /> Send via Peppol</Button>
              <Button onClick={() => { if (confirm('Delete this invoice?')) remove.mutate(); }} variant="outline" className="w-full justify-start text-destructive hover:text-destructive" data-testid="delete-btn"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Issue date</span><span className="font-medium">{formatDate(invoice.issue_date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Due date</span><span className="font-medium">{formatDate(invoice.due_date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span className="font-medium">{invoice.country_code}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="font-medium font-mono text-xs">{invoice.format}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span className="font-medium">{invoice.currency_code}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Signature</span><StatusBadge status={invoice.signature_status === 'unsigned' ? 'draft' : 'validated'} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> Timeline</CardTitle></CardHeader>
            <CardContent>
              <ol className="relative border-l border-border ml-2 space-y-4">
                {[
                  { label: 'Created', date: invoice.created_at },
                  invoice.signed_at && { label: 'Signed', date: invoice.signed_at },
                  invoice.sent_at && { label: 'Sent', date: invoice.sent_at },
                  invoice.archived_at && { label: 'Archived', date: invoice.archived_at },
                ].filter(Boolean).map((ev, i) => (
                  <li key={i} className="ml-4">
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-primary -left-[5px] mt-1.5" />
                    <p className="text-sm font-medium">{ev.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(ev.date)}</p>
                  </li>
                ))}
                {history.length > 0 && history.slice(0, 5).map((h, i) => (
                  <li key={`h${i}`} className="ml-4">
                    <div className="absolute w-2 h-2 rounded-full bg-muted-foreground -left-[4px] mt-1.5" />
                    <p className="text-sm">{h.action || h.event || 'Update'}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(h.created_at || h.timestamp)}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
