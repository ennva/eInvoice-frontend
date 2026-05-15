import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText, Users, Settings2, DollarSign, Globe, Plug, KeyRound, CreditCard, LayoutDashboard, Plus, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { CommandDialog, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty, CommandSeparator } from '../ui/command';
import { api } from '../../lib/api';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: async () => (await api.get('/invoices/')).data, enabled: open });

  useEffect(() => {
    const down = (e) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const go = (path) => { setOpen(false); navigate(path); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" data-testid="command-palette-input" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go('/invoices/new')} data-testid="cmd-new-invoice"><Plus className="w-4 h-4 mr-2" /> New invoice</CommandItem>
          <CommandItem onSelect={() => setTheme('light')}><Sun className="w-4 h-4 mr-2" /> Light theme</CommandItem>
          <CommandItem onSelect={() => setTheme('dark')}><Moon className="w-4 h-4 mr-2" /> Dark theme</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go('/dashboard')}><LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard</CommandItem>
          <CommandItem onSelect={() => go('/invoices')}><FileText className="w-4 h-4 mr-2" /> Invoices</CommandItem>
          <CommandItem onSelect={() => go('/customers')}><Users className="w-4 h-4 mr-2" /> Customers</CommandItem>
          <CommandItem onSelect={() => go('/countries')}><Globe className="w-4 h-4 mr-2" /> Countries</CommandItem>
          <CommandItem onSelect={() => go('/integrations')}><Plug className="w-4 h-4 mr-2" /> Integrations</CommandItem>
          <CommandItem onSelect={() => go('/currencies')}><DollarSign className="w-4 h-4 mr-2" /> Currencies</CommandItem>
          <CommandItem onSelect={() => go('/api-keys')}><KeyRound className="w-4 h-4 mr-2" /> API Keys</CommandItem>
          <CommandItem onSelect={() => go('/billing')}><CreditCard className="w-4 h-4 mr-2" /> Billing</CommandItem>
          <CommandItem onSelect={() => go('/settings')}><Settings2 className="w-4 h-4 mr-2" /> Settings</CommandItem>
        </CommandGroup>
        {invoices.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent invoices">
              {invoices.slice(0, 8).map((inv) => (
                <CommandItem key={inv.id} onSelect={() => go(`/invoices/${inv.id}`)}>
                  <FileText className="w-4 h-4 mr-2" /> {inv.invoice_number} <span className="ml-auto text-xs text-muted-foreground truncate max-w-[180px]">{inv.customer?.name || '—'}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
