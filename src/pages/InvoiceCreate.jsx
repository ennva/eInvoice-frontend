import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Save, Eye } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { api, formatCurrency, getErrorMessage } from '../lib/api';
import { COUNTRY_OPTIONS, INVOICE_FORMATS, PEPPOL_SCHEMES } from '../lib/utils';
import { toast } from 'sonner';

const emptyParty = () => ({
  name: '', vat_id: '', tax_id: '', siret: '', peppol_id: '', peppol_scheme: '0009',
  address: { street_name: '', city_name: '', postal_code: '', country_code: 'FR' },
  contact_email: '',
});

const emptyLine = (n = 1) => ({
  line_number: n, item_name: '', item_description: '', quantity: 1, unit_code: 'C62',
  price_amount: 0, line_extension_amount: 0,
  tax_category: { id: 'S', percent: 20, tax_scheme: 'VAT' },
});

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    invoice_number: '', issue_date: new Date().toISOString().split('T')[0], due_date: '',
    country_code: 'FR', format: 'UBL_2.1', currency_code: 'EUR',
    note: '', order_reference: '', payment_terms: '', recipient_email: '',
    supplier: emptyParty(), customer: emptyParty(), invoice_lines: [emptyLine(1)],
  });

  const totals = useMemo(() => {
    const lines = form.invoice_lines.map((l) => ({ ...l, line_extension_amount: (Number(l.quantity) || 0) * (Number(l.price_amount) || 0) }));
    const subtotal = lines.reduce((s, l) => s + l.line_extension_amount, 0);
    const tax = lines.reduce((s, l) => s + l.line_extension_amount * (Number(l.tax_category?.percent) || 0) / 100, 0);
    return { subtotal, tax, total: subtotal + tax, lines };
  }, [form.invoice_lines]);

  const updateParty = (key, field, value) => setForm((f) => ({ ...f, [key]: { ...f[key], [field]: value } }));
  const updateAddress = (key, field, value) => setForm((f) => ({ ...f, [key]: { ...f[key], address: { ...f[key].address, [field]: value } } }));
  const updateLine = (idx, patch) => setForm((f) => ({ ...f, invoice_lines: f.invoice_lines.map((l, i) => i === idx ? { ...l, ...patch } : l) }));
  const addLine = () => setForm((f) => ({ ...f, invoice_lines: [...f.invoice_lines, emptyLine(f.invoice_lines.length + 1)] }));
  const removeLine = (idx) => setForm((f) => ({ ...f, invoice_lines: f.invoice_lines.filter((_, i) => i !== idx).map((l, i) => ({ ...l, line_number: i + 1 })) }));

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        due_date: form.due_date || null,
        note: form.note || null,
        order_reference: form.order_reference || null,
        payment_terms: form.payment_terms || null,
        recipient_email: form.recipient_email || null,
        invoice_lines: totals.lines,
      };
      return (await api.post('/invoices/', payload)).data;
    },
    onSuccess: (inv) => { toast.success('Invoice created'); qc.invalidateQueries({ queryKey: ['invoices'] }); navigate(`/invoices/${inv.id}`); },
    onError: (e) => toast.error(getErrorMessage(e, 'Failed to create invoice')),
  });

  return (
    <div data-testid="invoice-create-page">
      <PageHeader
        breadcrumb={<button onClick={() => navigate('/invoices')} className="hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Invoices</button>}
        title="New invoice"
        description="Create a compliant e-invoice with EN 16931 validation."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/invoices')} data-testid="cancel-btn">Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90" data-testid="save-invoice-btn">
              <Save className="w-4 h-4 mr-1.5" /> {createMutation.isPending ? 'Saving…' : 'Save invoice'}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Invoice details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Invoice number *</Label><Input value={form.invoice_number} onChange={(e) => setForm({...form, invoice_number: e.target.value})} placeholder="INV-2026-001" data-testid="invoice-number-input" /></div>
              <div className="space-y-1.5"><Label>Issue date *</Label><Input type="date" value={form.issue_date} onChange={(e) => setForm({...form, issue_date: e.target.value})} data-testid="issue-date-input" /></div>
              <div className="space-y-1.5"><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({...form, due_date: e.target.value})} data-testid="due-date-input" /></div>
              <div className="space-y-1.5"><Label>Country *</Label>
                <Select value={form.country_code} onValueChange={(v) => setForm({...form, country_code: v})}>
                  <SelectTrigger data-testid="country-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRY_OPTIONS.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Format *</Label>
                <Select value={form.format} onValueChange={(v) => setForm({...form, format: v})}>
                  <SelectTrigger data-testid="format-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{INVOICE_FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Currency</Label><Input value={form.currency_code} onChange={(e) => setForm({...form, currency_code: e.target.value.toUpperCase()})} maxLength={3} data-testid="currency-input" /></div>
            </CardContent>
          </Card>

          {['supplier', 'customer'].map((key) => (
            <Card key={key}>
              <CardHeader><CardTitle className="text-base capitalize">{key}</CardTitle><CardDescription>Legal entity details</CardDescription></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2"><Label>Name *</Label><Input value={form[key].name} onChange={(e) => updateParty(key, 'name', e.target.value)} data-testid={`${key}-name-input`} /></div>
                <div className="space-y-1.5"><Label>VAT ID</Label><Input value={form[key].vat_id} onChange={(e) => updateParty(key, 'vat_id', e.target.value)} data-testid={`${key}-vat-input`} /></div>
                <div className="space-y-1.5"><Label>SIRET</Label><Input value={form[key].siret} onChange={(e) => updateParty(key, 'siret', e.target.value)} data-testid={`${key}-siret-input`} /></div>
                <div className="space-y-1.5"><Label>Peppol ID</Label><Input value={form[key].peppol_id} onChange={(e) => updateParty(key, 'peppol_id', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Peppol scheme</Label>
                  <Select value={form[key].peppol_scheme} onValueChange={(v) => updateParty(key, 'peppol_scheme', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PEPPOL_SCHEMES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Street</Label><Input value={form[key].address.street_name} onChange={(e) => updateAddress(key, 'street_name', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>City</Label><Input value={form[key].address.city_name} onChange={(e) => updateAddress(key, 'city_name', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Postal code</Label><Input value={form[key].address.postal_code} onChange={(e) => updateAddress(key, 'postal_code', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Country</Label>
                  <Select value={form[key].address.country_code} onValueChange={(v) => updateAddress(key, 'country_code', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COUNTRY_OPTIONS.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Contact email</Label><Input type="email" value={form[key].contact_email} onChange={(e) => updateParty(key, 'contact_email', e.target.value)} /></div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle className="text-base">Line items</CardTitle><CardDescription>Goods or services billed</CardDescription></div>
              <Button size="sm" variant="outline" onClick={addLine} data-testid="add-line-btn"><Plus className="w-4 h-4 mr-1.5" /> Add line</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.invoice_lines.map((line, idx) => (
                <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="col-span-12 sm:col-span-4 space-y-1.5"><Label className="text-xs">Item</Label><Input value={line.item_name} onChange={(e) => updateLine(idx, { item_name: e.target.value })} placeholder="Item name" data-testid={`line-name-${idx}`} /></div>
                  <div className="col-span-4 sm:col-span-2 space-y-1.5"><Label className="text-xs">Qty</Label><Input type="number" step="0.01" value={line.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} data-testid={`line-qty-${idx}`} /></div>
                  <div className="col-span-4 sm:col-span-2 space-y-1.5"><Label className="text-xs">Unit price</Label><Input type="number" step="0.01" value={line.price_amount} onChange={(e) => updateLine(idx, { price_amount: e.target.value })} data-testid={`line-price-${idx}`} /></div>
                  <div className="col-span-4 sm:col-span-2 space-y-1.5"><Label className="text-xs">VAT %</Label><Input type="number" step="0.1" value={line.tax_category.percent} onChange={(e) => updateLine(idx, { tax_category: { ...line.tax_category, percent: Number(e.target.value) } })} data-testid={`line-vat-${idx}`} /></div>
                  <div className="col-span-10 sm:col-span-1 flex items-end justify-end pt-5"><span className="text-sm font-semibold tabular-nums">{formatCurrency((Number(line.quantity) || 0) * (Number(line.price_amount) || 0), form.currency_code)}</span></div>
                  <div className="col-span-2 sm:col-span-1 flex items-end justify-end pt-5">{form.invoice_lines.length > 1 && (<button onClick={() => removeLine(idx)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" data-testid={`remove-line-${idx}`}><Trash2 className="w-4 h-4" /></button>)}</div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Additional</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label>Note</Label><Textarea value={form.note} onChange={(e) => setForm({...form, note: e.target.value})} rows={3} data-testid="note-input" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Order reference</Label><Input value={form.order_reference} onChange={(e) => setForm({...form, order_reference: e.target.value})} /></div>
                <div className="space-y-1.5"><Label>Payment terms</Label><Input value={form.payment_terms} onChange={(e) => setForm({...form, payment_terms: e.target.value})} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Recipient email</Label><Input type="email" value={form.recipient_email} onChange={(e) => setForm({...form, recipient_email: e.target.value})} data-testid="recipient-email-input" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-20 self-start">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2"><Eye className="w-4 h-4 text-muted-foreground" /><CardTitle className="text-base">Live preview</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="pb-3 border-b border-border">
                <p className="text-xs text-muted-foreground">Invoice number</p>
                <p className="font-semibold text-lg">{form.invoice_number || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">From</p><p className="font-medium truncate">{form.supplier.name || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">To</p><p className="font-medium truncate">{form.customer.name || '—'}</p></div>
              </div>
              <div className="pt-3 border-t border-border space-y-1.5">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(totals.subtotal, form.currency_code)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>VAT</span><span className="tabular-nums">{formatCurrency(totals.tax, form.currency_code)}</span></div>
                <div className="flex justify-between font-semibold text-base pt-1.5 border-t border-border"><span>Total</span><span className="tabular-nums" data-testid="preview-total">{formatCurrency(totals.total, form.currency_code)}</span></div>
              </div>
              <div className="pt-2 text-xs text-muted-foreground">{form.invoice_lines.length} line item{form.invoice_lines.length === 1 ? '' : 's'} · {form.format}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
