import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FileText, Users, Globe, Settings2, DollarSign,
  CreditCard, KeyRound, Plug, ChevronLeft, ChevronRight, BookOpen, Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/countries', label: 'Countries', icon: Globe },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/currencies', label: 'Currencies', icon: DollarSign },
  { to: '/api-keys', label: 'API Keys', icon: KeyRound },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings2 },
];

export default function Sidebar({ collapsed, setCollapsed, mobile = false, onNavigate }) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'h-full flex flex-col bg-sidebar text-sidebar-fg border-r border-sidebar-border transition-all duration-300',
        collapsed && !mobile ? 'w-[72px]' : 'w-[248px]'
      )}
      data-testid="app-sidebar"
    >
      {/* Brand */}
      <div className={cn('flex items-center gap-3 h-16 px-4 border-b border-sidebar-border', collapsed && !mobile && 'justify-center px-2')}>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 text-white" strokeWidth={2.4} />
        </div>
        {(!collapsed || mobile) && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold tracking-tight text-sidebar-fg">EInvoicePro</p>
            <p className="text-[10px] uppercase tracking-wider text-sidebar-muted">EU Compliance</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-0.5">
        {NAV.map((item) => {
          const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent/15 text-white'
                  : 'text-sidebar-muted hover:text-white hover:bg-white/5',
                collapsed && !mobile && 'justify-center'
              )}
            >
              {active && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-sidebar-accent"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
              {(!collapsed || mobile) && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <a
          href="/docs"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-muted hover:text-white hover:bg-white/5 transition-colors',
            collapsed && !mobile && 'justify-center'
          )}
          data-testid="nav-docs"
        >
          <BookOpen className="w-[18px] h-[18px]" strokeWidth={2} />
          {(!collapsed || mobile) && <span>Docs</span>}
        </a>
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-sidebar-muted hover:text-white hover:bg-white/5 transition-colors"
            data-testid="sidebar-collapse-btn"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        )}
      </div>
    </aside>
  );
}
