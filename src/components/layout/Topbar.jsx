import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Moon, Sun, LogOut, User, Plus, Command, Languages } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const [query, setQuery] = useState('');

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');

  const initials = (user?.full_name || user?.email || 'U')
    .split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="h-full flex items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-md hover:bg-muted transition-colors"
          data-testid="topbar-menu-btn"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-xl relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) navigate(`/invoices?q=${encodeURIComponent(query.trim())}`); }}
            placeholder="Search invoices, customers..."
            className="w-full h-10 pl-10 pr-14 rounded-lg bg-muted/60 border border-transparent text-sm placeholder:text-muted-foreground focus:bg-background focus:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 transition-all"
            data-testid="topbar-search"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-background border border-border rounded">
            <Command className="w-3 h-3" />K
          </kbd>
        </div>
        <div className="flex-1 sm:hidden" />

        {/* Actions */}
        <Button
          onClick={() => navigate('/invoices/new')}
          size="sm"
          className="hidden sm:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          data-testid="topbar-new-invoice-btn"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Invoice
        </Button>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Toggle theme"
          data-testid="theme-toggle-btn"
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        <button
          onClick={toggleLang}
          className="px-2 py-1 rounded-md hover:bg-muted transition-colors inline-flex items-center gap-1 text-xs font-semibold uppercase"
          aria-label="Switch language"
          data-testid="lang-toggle-btn"
        >
          <Languages className="w-4 h-4" /> {i18n.language === 'fr' ? 'FR' : 'EN'}
        </button>

        <button
          className="p-2 rounded-md hover:bg-muted transition-colors relative"
          aria-label="Notifications"
          data-testid="notifications-btn"
        >
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-muted transition-colors" data-testid="user-menu-btn">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.full_name || 'User'}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')} data-testid="menu-settings">
              <User className="w-4 h-4 mr-2" /> Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/billing')} data-testid="menu-billing">
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive" data-testid="menu-logout">
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
