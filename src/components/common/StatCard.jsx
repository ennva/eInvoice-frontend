import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, delta, accent = 'primary', sub, testId }) {
  const accents = {
    primary: 'from-indigo-500/10 to-indigo-500/0 text-indigo-600 dark:text-indigo-400',
    success: 'from-emerald-500/10 to-emerald-500/0 text-emerald-600 dark:text-emerald-400',
    warning: 'from-amber-500/10 to-amber-500/0 text-amber-600 dark:text-amber-400',
    info:    'from-cyan-500/10 to-cyan-500/0 text-cyan-600 dark:text-cyan-400',
    violet:  'from-violet-500/10 to-violet-500/0 text-violet-600 dark:text-violet-400',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
      data-testid={testId}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none', accents[accent])} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          {delta != null && (
            <div className={cn('inline-flex items-center gap-1 text-xs font-medium', delta >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(delta)}% vs last month
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-lg bg-background/60 flex items-center justify-center', accents[accent].split(' ').slice(-2).join(' '))}>
            <Icon className="w-5 h-5" strokeWidth={2.2} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
