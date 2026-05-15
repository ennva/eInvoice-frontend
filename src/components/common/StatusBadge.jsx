import React from 'react';
import { cn } from '../../lib/utils';
import {
  CheckCircle2, XCircle, FileText, Upload, Globe, CreditCard, Archive, Clock, AlertCircle, Send,
} from 'lucide-react';

const CONFIG = {
  draft:      { label: 'Draft',     cls: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700', icon: FileText },
  validated:  { label: 'Validated', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900', icon: CheckCircle2 },
  valid:      { label: 'Valid',     cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900', icon: CheckCircle2 },
  invalid:    { label: 'Invalid',   cls: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900', icon: XCircle },
  submitted:  { label: 'Submitted', cls: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900', icon: Upload },
  delivered:  { label: 'Delivered', cls: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-900', icon: Globe },
  rejected:   { label: 'Rejected',  cls: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900', icon: XCircle },
  paid:       { label: 'Paid',      cls: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900', icon: CreditCard },
  archived:   { label: 'Archived',  cls: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700', icon: Archive },
  sent:       { label: 'Sent',      cls: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900', icon: Send },
  received:   { label: 'Received',  cls: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-900', icon: Globe },
  pending:    { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900', icon: Clock },
  overdue:    { label: 'Overdue',   cls: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900', icon: AlertCircle },
};

export default function StatusBadge({ status, className }) {
  const key = (status || 'draft').toLowerCase();
  const cfg = CONFIG[key] || CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span
      data-testid={`status-${key}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset',
        cfg.cls,
        className,
      )}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
      {cfg.label}
    </span>
  );
}
