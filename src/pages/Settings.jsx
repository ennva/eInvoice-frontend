import React from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const initials = (user?.full_name || user?.email || 'U').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div data-testid="settings-page">
      <PageHeader title="Settings" description="Account, appearance, and preferences." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Profile</CardTitle><CardDescription>Your account information</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16"><AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-lg font-bold">{initials}</AvatarFallback></Avatar>
              <div>
                <p className="font-semibold text-lg">{user?.full_name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {user?.company_name && <p className="text-xs text-muted-foreground mt-0.5">{user.company_name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border text-sm">
              <div><p className="text-xs text-muted-foreground">Role</p><p className="font-medium capitalize">{user?.role}</p></div>
              <div><p className="text-xs text-muted-foreground">Plan</p><p className="font-medium capitalize">{user?.subscription_plan}</p></div>
            </div>
            <Button variant="outline" onClick={logout} className="text-destructive hover:text-destructive" data-testid="settings-logout-btn">Sign out</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Appearance</CardTitle><CardDescription>Theme preference</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {[{ k: 'light', label: 'Light', I: Sun }, { k: 'dark', label: 'Dark', I: Moon }, { k: 'system', label: 'System', I: Monitor }].map(({ k, label, I }) => (
                <button key={k} onClick={() => setTheme(k)} className={`p-3 rounded-lg border-2 transition-all ${theme === k ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/20'}`} data-testid={`theme-${k}`}>
                  <I className="w-4 h-4 mx-auto mb-1.5" />
                  <p className="text-xs font-medium">{label}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
