import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, ShieldCheck, AlertCircle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { api } from '../lib/api';

export default function Countries() {
  const { data: countries = {}, isLoading } = useQuery({ queryKey: ['countries'], queryFn: async () => (await api.get('/countries/')).data });
  const entries = Object.entries(countries);

  return (
    <div data-testid="countries-page">
      <PageHeader title="Countries" description="Per-country e-invoicing rules and required fields." />
      {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-48 rounded-xl animate-shimmer bg-muted" />)}</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map(([code, rule]) => (
            <Card key={code} data-testid={`country-card-${code}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{code}</div>
                    <div>
                      <CardTitle className="text-base">{rule.name || code}</CardTitle>
                      <p className="text-xs text-muted-foreground">{rule.region || rule.name_en}</p>
                    </div>
                  </div>
                  {rule.is_active !== false && <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">Active</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">VAT required</span>{rule.vat_id_required ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <span className="text-muted-foreground">—</span>}</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Date format</span><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{rule.date_format || '—'}</code></div>
                {rule.mandatory_fields?.length > 0 && (
                  <div><p className="text-xs text-muted-foreground mb-1.5">Mandatory fields</p><div className="flex flex-wrap gap-1">{rule.mandatory_fields.slice(0, 6).map((f) => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}{rule.mandatory_fields.length > 6 && <Badge variant="secondary" className="text-xs">+{rule.mandatory_fields.length - 6}</Badge>}</div></div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
