import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus, Copy, Trash2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api, formatDateTime, getErrorMessage } from '../lib/api';
import { toast } from 'sonner';

export default function ApiKeys() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState(null);

  const { data: keys = [], isLoading } = useQuery({ queryKey: ['api-keys'], queryFn: async () => (await api.get('/api-keys')).data });

  const create = useMutation({
    mutationFn: () => api.post('/api-keys', { name, scoped_entity_ids: [], rate_limit: 60 }),
    onSuccess: (r) => { setNewKey(r.data.key); qc.invalidateQueries({ queryKey: ['api-keys'] }); setName(''); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/api-keys/${id}`),
    onSuccess: () => { toast.success('API key revoked'); qc.invalidateQueries({ queryKey: ['api-keys'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div data-testid="api-keys-page">
      <PageHeader title="API Keys" description="Manage programmatic access to your workspace."
        actions={<Button onClick={() => { setOpen(true); setNewKey(null); }} className="bg-primary hover:bg-primary/90" data-testid="new-api-key-btn"><Plus className="w-4 h-4 mr-1.5" /> Generate key</Button>} />
      <Card className="overflow-hidden">
        {isLoading ? <div className="h-48 animate-shimmer bg-muted" /> : keys.length === 0 ? (
          <EmptyState icon={KeyRound} title="No API keys" description="Generate a key to access the API programmatically." testId="api-keys-empty" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border"><tr className="text-left text-xs uppercase text-muted-foreground"><th className="px-4 py-3">Name</th><th className="px-4 py-3">Prefix</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Last used</th><th className="px-4 py-3"></th></tr></thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-border hover:bg-muted/30" data-testid={`api-key-${k.id}`}>
                  <td className="px-4 py-3 font-medium">{k.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{k.key_prefix}…</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(k.created_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(k.last_used_at)}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => { if (confirm('Revoke this key?')) remove.mutate(k.id); }} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" data-testid={`revoke-${k.id}`}><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setNewKey(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{newKey ? 'API key created' : 'Generate API key'}</DialogTitle><DialogDescription>{newKey ? 'Copy your key now — it will not be shown again.' : 'Give your key a recognizable name.'}</DialogDescription></DialogHeader>
          {newKey ? (
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-3 font-mono text-xs break-all" data-testid="new-key-value">{newKey}</div>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(newKey); toast.success('Copied'); }} className="w-full"><Copy className="w-4 h-4 mr-2" /> Copy to clipboard</Button>
            </div>
          ) : (
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sandbox key" data-testid="key-name-input" /></div>
          )}
          <DialogFooter>
            {newKey ? <Button onClick={() => { setOpen(false); setNewKey(null); }}>Done</Button> :
              <><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => create.mutate()} disabled={!name || create.isPending} data-testid="confirm-create-key">Generate</Button></>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
