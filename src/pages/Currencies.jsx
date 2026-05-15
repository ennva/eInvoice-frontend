import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Plus, RefreshCw } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api, getErrorMessage } from '../lib/api';
import { toast } from 'sonner';

export default function Currencies() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', symbol: '' });
  const { data: currencies = [], isLoading } = useQuery({ queryKey: ['currencies'], queryFn: async () => (await api.get('/currencies/')).data });

  const create = useMutation({
    mutationFn: () => api.post('/currencies/', form),
    onSuccess: () => { toast.success('Currency created'); qc.invalidateQueries({ queryKey: ['currencies'] }); setOpen(false); setForm({ code: '', name: '', symbol: '' }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const refresh = useMutation({
    mutationFn: () => api.post('/currencies/refresh-rates'),
    onSuccess: () => { toast.success('Rates refreshed'); qc.invalidateQueries({ queryKey: ['currencies'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div data-testid="currencies-page">
      <PageHeader title="Currencies" description="Manage supported currencies and exchange rates."
        actions={<>
          <Button variant="outline" onClick={() => refresh.mutate()} disabled={refresh.isPending} data-testid="refresh-rates-btn"><RefreshCw className={`w-4 h-4 mr-1.5 ${refresh.isPending ? 'animate-spin' : ''}`} /> Refresh rates</Button>
          <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90" data-testid="add-currency-btn"><Plus className="w-4 h-4 mr-1.5" /> Add currency</Button>
        </>}
      />
      <Card className="overflow-hidden">
        {isLoading ? <div className="h-64 animate-shimmer bg-muted" /> : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border"><tr className="text-left text-xs uppercase text-muted-foreground"><th className="px-4 py-3">Code</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Symbol</th><th className="px-4 py-3 text-right">Exchange rate</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody>
              {currencies.map((c) => (
                <tr key={c.id} className="border-b border-border hover:bg-muted/30" data-testid={`currency-row-${c.code}`}>
                  <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.symbol}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{Number(c.exchange_rate).toFixed(4)}</td>
                  <td className="px-4 py-3">{c.is_base_currency ? <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Base</span> : c.is_active ? <span className="text-xs text-emerald-600">Active</span> : <span className="text-xs text-muted-foreground">Inactive</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add currency</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} maxLength={3} placeholder="USD" data-testid="currency-code-input" /></div>
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="US Dollar" data-testid="currency-name-input" /></div>
            <div><Label>Symbol</Label><Input value={form.symbol} onChange={(e) => setForm({...form, symbol: e.target.value})} placeholder="$" data-testid="currency-symbol-input" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !form.code} data-testid="save-currency-btn">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
