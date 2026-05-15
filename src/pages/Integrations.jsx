import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plug, ExternalLink, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';

export default function Integrations() {
  const { data: systems } = useQuery({ queryKey: ['accounting-systems'], queryFn: async () => (await api.get('/integrations/accounting/systems')).data, retry: false });
  const { data: configs = [] } = useQuery({ queryKey: ['integration-configs'], queryFn: async () => (await api.get('/integrations/configs')).data, retry: false });

  const list = systems?.supported_systems || [
    { code: 'sage', name: 'Sage' }, { code: 'quickbooks', name: 'QuickBooks' }, { code: 'xero', name: 'Xero' },
    { code: 'odoo', name: 'Odoo' }, { code: 'sap', name: 'SAP' }, { code: 'cegid', name: 'Cegid' },
  ];

  const isConnected = (code) => configs.some((c) => c.system_code === code && c.is_active);

  return (
    <div data-testid="integrations-page">
      <PageHeader title="Integrations" description="Connect your accounting systems to sync invoices automatically." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((sys) => (
          <Card key={sys.code} className="hover:shadow-md transition-shadow" data-testid={`integration-${sys.code}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary flex items-center justify-center"><Plug className="w-6 h-6" /></div>
                {isConnected(sys.code) && <div className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Connected</div>}
              </div>
              <CardTitle className="text-base mt-3">{sys.name}</CardTitle>
              <CardDescription className="text-xs">Sync invoices, customers, and tax data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant={isConnected(sys.code) ? 'outline' : 'default'} className="w-full" data-testid={`connect-${sys.code}-btn`}>
                {isConnected(sys.code) ? 'Manage' : 'Connect'} <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
