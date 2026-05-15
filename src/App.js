import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link, useLocation } from "react-router-dom";
import { ThemeProvider } from 'next-themes';
import { useTranslation } from 'react-i18next';
import axios from "axios";
// Import i18n configuration
import './i18n';
import i18n from './i18n';
import { API, getBackendErrorMessage } from './lib/api';
import { track, trackPageView } from './lib/analytics';

// Import components
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

// Import new components
import LanguageSwitcher from './components/LanguageSwitcher';
import ThemeSwitcher from './components/ThemeSwitcher';
import InvalidFieldsIndicator from './components/InvalidFieldsIndicator';
import CountryManager from './components/CountryManager';
import IntegrationManager from './components/IntegrationManager';

// Import icons
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  Settings,
  BarChart3,
  Globe,
  CreditCard,
  Building2,
  Plus,
  Eye,
  Trash2,
  RefreshCw,
  LogOut,
  User,
  Shield,
  Send,
  DollarSign,
  Award,
  ArrowRight,
  Mail,
  Lock,
  BookOpen,
  Network,
  KeyRound,
  Archive,
  Landmark
} from "lucide-react";

const TOKEN_STORAGE_KEY = process.env.REACT_APP_TOKEN_STORAGE_KEY || 'einvoicepro_token';
const COUNTRY_OPTIONS = [
  { code: 'FR', fr: 'France', en: 'France' },
  { code: 'DE', fr: 'Allemagne', en: 'Germany' },
  { code: 'IT', fr: 'Italie', en: 'Italy' },
  { code: 'ES', fr: 'Espagne', en: 'Spain' },
  { code: 'NL', fr: 'Pays-Bas', en: 'Netherlands' },
  { code: 'LU', fr: 'Luxembourg', en: 'Luxembourg' },
  { code: 'BE', fr: 'Belgique', en: 'Belgium' },
  { code: 'AT', fr: 'Autriche', en: 'Austria' },
  { code: 'PT', fr: 'Portugal', en: 'Portugal' }
];
const EMPTY_CURRENCY_FORM = {
  code: '',
  name: '',
  symbol: '',
  exchange_rate: 1
};
const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);
const getAuthHeaders = () => ({
  Authorization: `Bearer ${getStoredToken() || ''}`
});

const normalizeInvoiceStatus = (status) => ({
  valid: 'validated',
  acknowledged: 'delivered'
}[status] || status || 'draft');

const compliantInvoiceStatuses = new Set([
  'validated',
  'submitted',
  'delivered',
  'paid',
  'archived'
]);

const finalSendingStatuses = new Set(['sent', 'acknowledged', 'delivery_confirmed']);

const PEPPOL_SCHEME_OPTIONS = [
  { value: '0009', label: 'FR:SIRET (0009)' },
  { value: '9952', label: 'LU:VAT (9952)' },
  { value: '9938', label: 'LU:VAT (9938)' },
  { value: '0190', label: 'NL:KVK (0190)' },
  { value: '0208', label: 'BE:VAT (0208)' },
  { value: '9930', label: 'DE:VAT (9930)' },
  { value: '0088', label: 'GLN (0088)' },
  { value: '0002', label: 'Email (0002)' }
];

if (!axios.__einvoiceAuthInterceptorConfigured) {
  axios.__einvoiceAuthInterceptorConfigured = true;

  axios.interceptors.request.use((config) => {
    const token = getStoredToken();
    const headers = config.headers || {};

    if (token) {
      headers.Authorization = headers.Authorization || `Bearer ${token}`;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete headers.Authorization;
      delete axios.defaults.headers.common['Authorization'];
    }

    headers['Accept-Language'] = i18n.language || localStorage.getItem('einvoicepro_language') || 'fr';
    config.headers = headers;
    return config;
  });
}

// Context d'authentification
const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider d'authentification
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un token existe au démarrage
    const token = getStoredToken();
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Token invalide:', error);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;

      localStorage.setItem(TOKEN_STORAGE_KEY, access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur de connexion'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      const { access_token, user: newUser } = response.data;

      localStorage.setItem(TOKEN_STORAGE_KEY, access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(newUser);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur de création de compte'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const refreshUser = async () => {
    const token = getStoredToken();
    if (token) {
      await verifyToken(token);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    refreshUser,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Composant Landing Page avec i18n
const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:justify-between sm:items-center sm:min-h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">EInvoicePro</h1>
                <p className="text-xs text-slate-500">Conformité EU 2014/55/EU</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <LanguageSwitcher />
              <ThemeSwitcher />
              <Button
                variant="ghost"
                onClick={() => {
                  track('docs_nav_clicked', { source: 'landing_header' });
                  navigate('/docs');
                }}
                data-testid="docs-btn"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {t('navigation.docs')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  track('login_clicked', { source: 'landing_header' });
                  navigate('/login');
                }}
                data-testid="login-btn"
              >
                {t('auth.login')}
              </Button>
              <Button
                onClick={() => {
                  track('signup_clicked', { source: 'landing_header' });
                  navigate('/register');
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="register-btn"
              >
                {t('auth.register')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              {t('landing.title')} <br />
              <span className="text-indigo-600">{t('landing.subtitle')}</span>
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              {t('landing.description')}
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <Button
                size="lg"
                onClick={() => {
                  track('signup_clicked', { source: 'hero' });
                  navigate('/register');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-4"
                data-testid="hero-cta-btn"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                {t('landing.start_free')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  track('login_clicked', { source: 'hero' });
                  navigate('/login');
                }}
                className="text-lg px-8 py-4"
                data-testid="hero-login-btn"
              >
                {t('landing.sign_in')}
              </Button>
            </div>

            {/* Badges de conformité */}
            <div className="flex flex-wrap justify-center gap-3">
              <Badge className="bg-emerald-100 text-emerald-800 px-4 py-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('landing.badges.en16931')}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
                <Network className="w-4 h-4 mr-2" />
                {t('landing.badges.peppol')}
              </Badge>
              <Badge className="bg-amber-100 text-amber-800 px-4 py-2">
                <Landmark className="w-4 h-4 mr-2" />
                {t('landing.badges.pa_progress')}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">
              {t('landing.why_choose')}
            </h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t('landing.complete_solution')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>{t('landing.guaranteed_compliance')}</CardTitle>
                <CardDescription>
                  {t('landing.compliance_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li>{t('landing.features.formats')}</li>
                  <li>{t('landing.features.validation')}</li>
                  <li>{t('landing.features.updates')}</li>
                  <li>{t('landing.features.xml')}</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle>{t('landing.simple_integration')}</CardTitle>
                <CardDescription>
                  {t('landing.integration_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li>{t('landing.features.systems')}</li>
                  <li>{t('landing.features.api')}</li>
                  <li>{t('landing.features.sync')}</li>
                  <li>{t('landing.features.protocol')}</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <CardTitle>{t('landing.intuitive_interface')}</CardTitle>
                <CardDescription>
                  {t('landing.interface_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li>{t('landing.features.dashboard')}</li>
                  <li>{t('landing.features.assistant')}</li>
                  <li>{t('landing.features.history')}</li>
                  <li>{t('landing.features.reports')}</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            {t('landing.ready_compliant')}
          </h3>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            {t('landing.join_companies')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                track('signup_clicked', { source: 'landing_cta' });
                navigate('/register');
              }}
              className="text-lg px-8 py-4"
              data-testid="cta-register-btn"
            >
              {t('landing.create_free_account')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                track('docs_cta_clicked', { source: 'landing_cta' });
                navigate('/docs');
              }}
              className="text-lg px-8 py-4 bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              {t('navigation.docs')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">EInvoicePro</span>
            </div>
            <p className="text-sm">
              {t('landing.footer')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {[
                { label: 'Peppol network', icon: Network },
                { label: 'Storecove partner', icon: Shield },
                { label: 'Chorus Pro · FR B2G', icon: Landmark },
                { label: 'Guichet.lu · LU B2G', icon: Globe }
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="border border-slate-700 rounded-lg px-3 py-2 text-slate-200 flex items-center justify-center gap-2">
                  <Icon className="w-4 h-4 text-cyan-300" />
                  <span className="text-xs font-medium">{label}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 text-sm">
              <Link to="/docs" className="text-cyan-300 hover:text-cyan-200">{t('navigation.docs')}</Link>
              <Link to="/docs/compliance-roadmap" className="text-cyan-300 hover:text-cyan-200">{t('docs.roadmap_title')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const DocsPage = ({ focus = 'overview' }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (focus === 'roadmap') {
      document.getElementById('compliance-roadmap')?.scrollIntoView({ block: 'start' });
    }
  }, [focus]);

  const endpointRows = [
    ['POST', '/api/v1/api-keys', 'Create a sandbox or production API key; the secret is returned once.'],
    ['POST', '/api/v1/validate', 'Validate XML before creating or submitting an invoice.'],
    ['POST', '/api/v1/invoices', 'Create a draft invoice with UBL or CII format preference.'],
    ['POST', '/api/v1/invoices/{id}/validate', 'Run EN 16931 validation and persist validation_result.'],
    ['POST', '/api/v1/invoices/{id}/send', 'Submit through Storecove / Peppol after validation.'],
    ['GET', '/api/v1/invoices/{guid}/status', 'Poll lifecycle status by delivery GUID.'],
    ['GET', '/api/v1/invoices/{guid}/download', 'Get signed XML or PDF archive download URLs.']
  ];

  const statuses = ['draft', 'validated', 'invalid', 'submitted', 'delivered', 'rejected', 'paid', 'archived', 'sent', 'received'];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">EInvoicePro</p>
              <p className="text-xs text-slate-500">{t('docs.public_docs')}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline" onClick={() => navigate('/')}>{t('common.back')}</Button>
            <Button onClick={() => {
              track('signup_clicked', { source: 'docs_header' });
              navigate('/register');
            }}>
              {t('auth.register')}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <section className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              {t('landing.badges.en16931')}
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
              <Network className="w-4 h-4 mr-2" />
              {t('landing.badges.peppol')}
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 px-3 py-1">
              <Landmark className="w-4 h-4 mr-2" />
              {t('landing.badges.pa_progress')}
            </Badge>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">{t('docs.title')}</h1>
            <p className="text-lg text-slate-600 mt-3 max-w-3xl">{t('docs.subtitle')}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> Quickstart</CardTitle>
              <CardDescription>Create a key, validate XML, submit, poll, and download the archive.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-slate-950 text-slate-100 rounded-lg p-4 overflow-x-auto">{`curl -X POST ${API}/api-keys \\
  -H "Authorization: Bearer <user-token>" \\
  -d '{"name":"Sandbox key"}'

curl -X POST ${API}/validate \\
  -H "Authorization: Bearer einv_test_..." \\
  -H "Content-Type: application/xml" \\
  --data-binary @invoice.xml`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Network className="w-5 h-5" /> FR + LU Guide</CardTitle>
              <CardDescription>Identifiers and public-sector routing expectations for France and Luxembourg.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>France: SIRET Peppol scheme 0009, French VAT when available, B2G routing through Chorus Pro.</p>
              <p>Luxembourg: LU VAT / Peppol schemes 9952 or 9938, B2G routing through Guichet.lu paths.</p>
              <p>All submissions remain EN 16931-compliant and Peppol-connected through Storecove.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Archive className="w-5 h-5" /> Sandbox</CardTitle>
              <CardDescription>Use dashboard-generated sandbox API keys for partner tests.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>Base URL: <code className="bg-slate-100 px-1 rounded">{API}</code></p>
              <p>Bearer tokens use the dashboard API key secret. Test keys should be named clearly and revoked after trials.</p>
              <p>Recommended flow: validate XML, create invoice, send, poll status, download XML/PDF archive URL.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('docs.api_reference')}</CardTitle>
              <CardDescription>Public API shape for API-first integrations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {endpointRows.map(([method, path, description]) => (
                <div key={method + path} className="grid grid-cols-[72px_1fr] gap-3 text-sm border-b border-slate-100 pb-3">
                  <Badge variant="outline" className="justify-center">{method}</Badge>
                  <div>
                    <code className="font-semibold">{path}</code>
                    <p className="text-slate-600 mt-1">{description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('docs.statuses')}</CardTitle>
              <CardDescription>These are the invoice statuses returned by the invoice API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {statuses.map(status => (
                  <Badge key={status} variant="outline" className="capitalize">{status}</Badge>
                ))}
              </div>
              <div className="text-sm text-slate-600 space-y-2">
                <p><strong>Validation errors:</strong> structured responses include rule ID, human message, field XPath, severity, and source.</p>
                <p><strong>Format preference:</strong> invoice submissions expose UBL and CII options before Storecove transmission.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="compliance-roadmap" className={focus === 'roadmap' ? 'ring-2 ring-indigo-200 rounded-lg' : ''}>
          <Card>
            <CardHeader>
              <CardTitle>{t('docs.roadmap_title')}</CardTitle>
              <CardDescription>{t('docs.roadmap_subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">Available now</h3>
                <p>EN 16931 validation, Peppol-connected delivery, Storecove partner routing, API keys, and immutable invoice archive URLs.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">In progress</h3>
                <p>Solution Compatible registration and PA immatriculation for the French 2026 e-invoicing reform.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">Not claimed</h3>
                <p>EInvoicePro does not claim DGFiP PA approval today. Messaging is intentionally limited to Peppol-connected and EN 16931-compliant capabilities.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

// Composant Login avec i18n
const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success(t('auth.login_success'));
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await register(formData);

    if (result.success) {
      toast.success(t('auth.register_success'));
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 px-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">EInvoicePro</h1>
              <p className="text-sm text-slate-500">Conformité EU 2014/55/EU</p>
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <LanguageSwitcher />
          </div>

          <h2 className="text-3xl font-bold text-slate-900">
            {showRegister ? t('auth.register') : t('auth.login')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {showRegister
              ? t('auth.register_subtitle')
              : t('auth.login_subtitle')
            }
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={showRegister ? handleRegister : handleLogin} className="space-y-4">
              {showRegister && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{t('auth.full_name')} *</Label>
                    <Input
                      id="full_name"
                      type="text"
                      required
                      value={formData.full_name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder={t('auth.full_name')}
                      data-testid="register-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_name">{t('auth.company_name')}</Label>
                    <Input
                      id="company_name"
                      type="text"
                      value={formData.company_name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder={t('auth.company_name')}
                      data-testid="register-company-input"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')} *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="votre.email@entreprise.fr"
                    data-testid="email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')} *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    required
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={showRegister ? t('auth.min_password') : t('auth.password')}
                    minLength={showRegister ? 6 : undefined}
                    data-testid="password-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
                data-testid="auth-submit-btn"
              >
                {loading ? t('common.loading') : (showRegister ? t('auth.sign_up') : t('auth.sign_in'))}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setShowRegister(!showRegister)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
                data-testid="toggle-auth-mode"
              >
                {showRegister
                  ? t('auth.already_account')
                  : t('auth.no_account')
                }
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm text-slate-600 hover:text-slate-500"
                data-testid="back-to-home"
              >
                {t('auth.back_to_home')}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};// Continuation of App.js

// Composant Dashboard mis à jour avec i18n et nouvelles fonctionnalités
const EInvoicePro = () => {
  const { user, logout, refreshUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // États pour les données
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [validationResultsByInvoice, setValidationResultsByInvoice] = useState({});
  const [billingUsage, setBillingUsage] = useState(null);
  const [eReportingByInvoice, setEReportingByInvoice] = useState({});
  const [loading, setLoading] = useState(false);
  const [countryRules, setCountryRules] = useState({});
  const [supportedSystems, setSupportedSystems] = useState([]);
  const [requiredFields, setRequiredFields] = useState([]);
  const [loadingRequiredFields, setLoadingRequiredFields] = useState(false);
  const [countryInfo, setCountryInfo] = useState({});
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // États pour les nouvelles fonctionnalités
  const [currencies, setCurrencies] = useState([]);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [currencyForm, setCurrencyForm] = useState(EMPTY_CURRENCY_FORM);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);

  // États pour les opérations en lot
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  // États pour les formulaires
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Formulaire création facture
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    country_code: 'FR',
    format: 'UBL_2.1',
    currency_code: 'EUR',
    note: '',
    order_reference: '',
    contract_reference: '',
    purchase_order_ref: '',
    buyer_reference: '',
    payment_terms: '',
    recipient_email: '',
    supplier: {
      name: '',
      vat_id: '',
      tax_id: '',
      siret: '',
      peppol_id: '',
      peppol_scheme: '0009',
      address: {
        street_name: '',
        city_name: '',
        postal_code: '',
        country_code: 'FR'
      },
      contact_email: ''
    },
    customer: {
      name: '',
      vat_id: '',
      tax_id: '',
      siret: '',
      peppol_id: '',
      peppol_scheme: '0009',
      address: {
        street_name: '',
        city_name: '',
        postal_code: '',
        country_code: 'FR'
      },
      contact_email: ''
    },
    invoice_lines: [{
      line_number: 1,
      item_name: '',
      item_description: '',
      quantity: 1,
      unit_code: 'C62',
      price_amount: 0,
      line_extension_amount: 0,
      tax_category: {
        id: 'S',
        percent: 20,
        tax_scheme: 'VAT'
      }
    }]
  });

  const resetInvoiceForm = () => {
    setInvoiceForm({
      invoice_number: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      country_code: 'FR',
      format: 'UBL_2.1',
      currency_code: 'EUR',
      note: '',
      order_reference: '',
      contract_reference: '',
      purchase_order_ref: '',
      buyer_reference: '',
      payment_terms: '',
      recipient_email: '',
      supplier: {
        name: '',
        vat_id: '',
        tax_id: '',
        siret: '',
        peppol_id: '',
        peppol_scheme: '0009',
        address: {
          street_name: '',
          city_name: '',
          postal_code: '',
          country_code: 'FR'
        },
        contact_email: ''
      },
      customer: {
        name: '',
        vat_id: '',
        tax_id: '',
        siret: '',
        peppol_id: '',
        peppol_scheme: '0009',
        address: {
          street_name: '',
          city_name: '',
          postal_code: '',
          country_code: 'FR'
        },
        contact_email: ''
      },
      invoice_lines: [{
        line_number: 1,
        item_name: '',
        item_description: '',
        quantity: 1,
        unit_code: 'C62',
        price_amount: 0,
        line_extension_amount: 0,
        tax_category: {
          id: 'S',
          percent: 20,
          tax_scheme: 'VAT'
        }
      }]
    });
  };

  // Chargement initial
  useEffect(() => {
    loadInvoices();
    loadCountryRules();
    loadSupportedSystems();
    loadCurrencies();
    loadBillingUsage();
  }, []);

  // Charger les champs requis quand les pays changent
  useEffect(() => {
    const supplierCountry = invoiceForm.supplier.address.country_code;
    const customerCountry = invoiceForm.customer.address.country_code;
    if (supplierCountry || customerCountry) {
      loadRequiredFields(supplierCountry, customerCountry);
    }
  }, [invoiceForm.supplier.address.country_code, invoiceForm.customer.address.country_code]);

  // Initial load of required fields on mount
  useEffect(() => {
    const supplierCountry = invoiceForm.supplier.address.country_code;
    const customerCountry = invoiceForm.customer.address.country_code;
    if (supplierCountry || customerCountry) {
      loadRequiredFields(supplierCountry, customerCountry);
    }
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/invoices`, {
        headers: getAuthHeaders()
      });
      setInvoices(response.data);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      toast.error(error.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const getCountryName = (code) => {
    const country = COUNTRY_OPTIONS.find(option => option.code === code);
    if (!country) return code;
    return i18n.language === 'en' ? country.en : country.fr;
  };

  const loadCountryRules = async () => {
    try {
      const response = await axios.get(`${API}/countries`);
      setCountryRules(response.data);
    } catch (error) {
      console.error('Erreur chargement règles pays:', error);
    }
  };

  const loadSupportedSystems = async () => {
    try {
      const response = await axios.get(`${API}/integrations/accounting/systems`);
      setSupportedSystems(response.data.supported_systems);
    } catch (error) {
      console.error('Erreur chargement systèmes:', error);
    }
  };

  const loadRequiredFields = async (supplierCountry, customerCountry) => {
    try {
      setLoadingRequiredFields(true);
      const params = new URLSearchParams();
      if (supplierCountry) params.append('supplier_country', supplierCountry);
      if (customerCountry) params.append('customer_country', customerCountry);

      const response = await axios.get(`${API}/countries/required-fields?${params.toString()}`);
      setRequiredFields(response.data.required_fields || []);
      setCountryInfo(response.data.countries_info || {});

      // Show a toast to inform user about field requirements
      if (response.data.required_fields && response.data.required_fields.length > 0) {
        toast.info(t('invoices.required_fields_updated', {
          count: response.data.required_fields.length
        }));
      }
    } catch (error) {
      console.error('Erreur chargement champs requis:', error);
      setRequiredFields([]);
      toast.error(t('common.error'));
    } finally {
      setLoadingRequiredFields(false);
    }
  };

  const loadCurrencies = async () => {
    try {
      const response = await axios.get(`${API}/currencies`, {
        headers: getAuthHeaders()
      });
      setCurrencies(response.data);
    } catch (error) {
      console.error('Erreur chargement devises:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    }
  };

  const loadBillingUsage = async () => {
    try {
      const response = await axios.get(`${API}/billing/usage`, {
        headers: getAuthHeaders()
      });
      setBillingUsage(response.data);
    } catch (error) {
      console.error('Erreur chargement usage facturation:', error);
    }
  };

  const openCreateCurrencyDialog = () => {
    setEditingCurrency(null);
    setCurrencyForm(EMPTY_CURRENCY_FORM);
    setShowCurrencyDialog(true);
  };

  const openEditCurrencyDialog = (currency) => {
    setEditingCurrency(currency);
    setCurrencyForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchange_rate: currency.exchange_rate
    });
    setShowCurrencyDialog(true);
  };

  const saveCurrency = async () => {
    try {
      setLoading(true);
      if (editingCurrency) {
        await axios.put(
          `${API}/currencies/${editingCurrency.id}`,
          {
            name: currencyForm.name,
            symbol: currencyForm.symbol,
            exchange_rate: Number(currencyForm.exchange_rate) || 1
          },
          { headers: getAuthHeaders() }
        );
        toast.success(t('currencies.updated_success'));
      } else {
        await axios.post(
          `${API}/currencies`,
          {
            code: currencyForm.code.trim().toUpperCase(),
            name: currencyForm.name.trim(),
            symbol: currencyForm.symbol.trim()
          },
          { headers: getAuthHeaders() }
        );
        toast.success(t('currencies.created_success'));
      }
      setShowCurrencyDialog(false);
      setEditingCurrency(null);
      setCurrencyForm(EMPTY_CURRENCY_FORM);
      await loadCurrencies();
    } catch (error) {
      console.error('Erreur sauvegarde devise:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const deleteCurrency = async (currency) => {
    try {
      setLoading(true);
      await axios.delete(`${API}/currencies/${currency.id}`, {
        headers: getAuthHeaders()
      });
      toast.success(t('currencies.deleted_success'));
      await loadCurrencies();
    } catch (error) {
      console.error('Erreur suppression devise:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const signInvoice = async (invoiceId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/invoices/${invoiceId}/sign`, {}, {
        headers: getAuthHeaders()
      });

      toast.success(t('invoices.signed_successfully'));
      loadInvoices(); // Recharger la liste

      return response.data;
    } catch (error) {
      console.error('Erreur signature facture:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const sendInvoice = async (invoiceId, recipientEmail = null) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/invoices/${invoiceId}/send`,
        recipientEmail ? { recipient_email: recipientEmail } : {},
        {
          headers: getAuthHeaders()
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || t('invoices.sent_successfully'));
        if (response.data.e_reporting) {
          setEReportingByInvoice(prev => ({
            ...prev,
            [invoiceId]: response.data.e_reporting
          }));
        }
      } else {
        toast.error(response.data.message || t('common.error'));
      }

      loadInvoices();
      return response.data;
    } catch (error) {
      console.error('Erreur envoi facture:', error);
      const detail = error.response?.data?.detail;
      if (error.response?.status === 402 && detail?.checkout_url) {
        toast.warning(detail.message || t('billing.limit_reached'));
        window.location.href = detail.checkout_url;
        return;
      }
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  // Nouvelles fonctions pour les opérations en lot
  const handleUpgrade = async (plan) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/billing/checkout?plan=${plan}`, {}, {
        headers: getAuthHeaders()
      });
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Erreur checkout:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/billing/portal`, {}, {
        headers: getAuthHeaders()
      });
      if (response.data.portal_url) {
        window.location.href = response.data.portal_url;
      }
    } catch (error) {
      console.error('Erreur portail:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const bulkSignInvoices = async (invoiceIds) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/invoices/bulk-sign`, invoiceIds, {
        headers: getAuthHeaders()
      });

      const { successful, failed, total } = response.data;
      toast.success(t('invoices.bulk_sign_result', { successful, total }));

      if (failed > 0) {
        toast.warning(t('invoices.bulk_sign_partial', { failed }));
      }

      loadInvoices();
      return response.data;
    } catch (error) {
      console.error('Erreur signature en lot:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const bulkSendInvoices = async (invoiceIds, defaultEmail = null) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/invoices/bulk-send`, invoiceIds, {
        params: { default_recipient_email: defaultEmail },
        headers: getAuthHeaders()
      });

      const results = response.data.results;
      const successCount = response.data.successful ?? results.filter(result => result.success).length;
      const failCount = response.data.failed ?? results.filter(result => !result.success).length;

      toast.success(t('invoices.bulk_send_result', { successCount, total: results.length }));
      if (failCount > 0) {
        toast.warning(t('invoices.bulk_send_partial', { failCount }));
      }

      loadInvoices();
      loadBillingUsage();
      return response.data;
    } catch (error) {
      console.error('Erreur envoi en lot:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoiceSecurely = async (invoiceId) => {
    try {
      setLoading(true);
      await axios.delete(`${API}/invoices/${invoiceId}`, {
        headers: getAuthHeaders()
      });

      toast.success(t('invoices.deleted_successfully'));
      loadInvoices();
      setShowDeleteConfirmDialog(false);
      setDeletingInvoiceId(null);
    } catch (error) {
      console.error('Erreur suppression facture:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const validateFormBeforeSubmission = () => {
    const errors = [];

    // Check required fields based on country selection
    requiredFields.forEach(field => {
      const fieldPath = field.split('.');
      let value = invoiceForm;

      for (const part of fieldPath) {
        value = value?.[part];
      }

      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(t('validation.errors.required_field') + ': ' + field.replace('.', ' → '));
      }
    });

    return errors;
  };

  const sanitizeInvoicePayload = (payload) => {
    const sanitized = {
      ...payload,
      due_date: payload.due_date || null,
      note: payload.note || null,
      order_reference: payload.order_reference || null,
      payment_terms: payload.payment_terms || null,
      recipient_email: payload.recipient_email || null,
    };

    return sanitized;
  };

  const createInvoice = async () => {
    try {
      // Validate form client-side first
      const validationErrors = validateFormBeforeSubmission();
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        return;
      }

      setLoading(true);

      const calculatedForm = { ...invoiceForm };
      calculatedForm.invoice_lines = calculatedForm.invoice_lines.map(line => ({
        ...line,
        line_extension_amount: line.quantity * line.price_amount
      }));

      const response = await axios.post(`${API}/invoices`, sanitizeInvoicePayload(calculatedForm), {
        headers: getAuthHeaders()
      });
      toast.success(t('invoices.created_success'));
      setShowCreateDialog(false);
      loadInvoices();

      setInvoiceForm({
        ...invoiceForm,
        invoice_number: '',
        note: '',
        order_reference: '',
        payment_terms: '',
        recipient_email: '',
        currency_code: 'EUR',
        invoice_lines: [{
          line_number: 1,
          item_name: '',
          item_description: '',
          quantity: 1,
          unit_code: 'C62',
          price_amount: 0,
          line_extension_amount: 0,
          tax_category: {
            id: 'S',
            percent: 20,
            tax_scheme: 'VAT'
          }
        }]
      });
    } catch (error) {
      console.error('Erreur création facture:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const validateInvoice = async (invoiceId) => {
    try {
      setLoading(true);
      const currentLanguage = i18n.language || 'fr';
      const response = await axios.post(
        `${API}/invoices/${invoiceId}/validate?language=${currentLanguage}`,
        {},
        {
          headers: getAuthHeaders()
        }
      );
      setValidationResult(response.data);
      setValidationResultsByInvoice(prev => ({
        ...prev,
        [invoiceId]: response.data
      }));

      if (response.data.status === 'valid') {
        toast.success(t('invoices.validation_success'));
      } else {
        toast.warning(t('invoices.validation_warning'));
      }

      loadInvoices();
    } catch (error) {
      console.error('Erreur validation facture:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (invoiceId, updateData) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API}/invoices/${invoiceId}`, sanitizeInvoicePayload(updateData), {
        headers: getAuthHeaders()
      });
      toast.success(t('invoices.updated_success'));
      setShowEditDialog(false);
      setEditingInvoice(null);
      loadInvoices();
      return response.data;
    } catch (error) {
      console.error('Erreur mise à jour facture:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const viewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewDialog(true);
  };

  const editInvoice = (invoice) => {
    setEditingInvoice({ ...invoice });
    setShowEditDialog(true);
  };

  const fixInvalidFields = (invoice) => {
    setActiveTab("invoices");
    editInvoice(invoice);
  };

  const exportInvoice = async (invoiceId, format) => {
    try {
      const normalizedFormat = format.toLowerCase();
      const isXmlExport = ['ubl', 'cii', 'facturx-xml', 'factur-x-xml'].includes(normalizedFormat);
      const response = await axios.get(`${API}/invoices/${invoiceId}/export/${format}`, {
        headers: getAuthHeaders(),
        responseType: isXmlExport ? 'text' : 'json'
      });

      if (isXmlExport) {
        const blob = new Blob([response.data], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${invoiceId}_${normalizedFormat}.xml`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast.success(t('invoices.export_success', { format: format.toUpperCase() }));
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    }
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = normalizeInvoiceStatus(status);
    const statusConfig = {
      validated: { variant: "default", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle, label: t('status.validated') || 'Validated' },
      invalid: { variant: "destructive", className: "bg-red-100 text-red-800", icon: XCircle, label: t('status.invalid') || 'Invalid' },
      draft: { variant: "secondary", className: "bg-slate-100 text-slate-600", icon: FileText, label: t('status.draft') || 'Draft' },
      submitted: { variant: "outline", className: "bg-blue-100 text-blue-800", icon: Upload, label: t('status.submitted') || 'Submitted' },
      delivered: { variant: "outline", className: "bg-cyan-100 text-cyan-800", icon: Globe, label: t('status.delivered') || 'Delivered' },
      rejected: { variant: "destructive", className: "bg-red-100 text-red-800", icon: XCircle, label: t('status.rejected') || 'Rejected' },
      paid: { variant: "default", className: "bg-purple-100 text-purple-800", icon: CreditCard, label: t('status.paid') || 'Paid' },
      archived: { variant: "outline", className: "bg-slate-200 text-slate-800", icon: Archive, label: t('status.archived') || 'Archived' },
      sent: { variant: "outline", className: "bg-blue-100 text-blue-800", icon: Upload, label: t('status.sent') || 'Sent' },
      received: { variant: "outline", className: "bg-cyan-100 text-cyan-800", icon: Globe, label: t('status.received') || 'Received' }
    };

    const config = statusConfig[normalizedStatus] || statusConfig.draft;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const addInvoiceLine = () => {
    setInvoiceForm(prev => ({
      ...prev,
      invoice_lines: [
        ...prev.invoice_lines,
        {
          line_number: prev.invoice_lines.length + 1,
          item_name: '',
          item_description: '',
          quantity: 1,
          unit_code: 'C62',
          price_amount: 0,
          line_extension_amount: 0,
          tax_category: {
            id: 'S',
            percent: 20,
            tax_scheme: 'VAT'
          }
        }
      ]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="einvoice-dashboard">
      <Toaster />

      {/* Header avec logout et language switcher */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">EInvoicePro</h1>
                <p className="text-xs text-slate-500">Conformité EU 2014/55/EU</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <LanguageSwitcher />

              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span className="max-w-[120px] truncate">{user?.full_name}</span>
              </div>

              <Badge className="hidden md:flex bg-emerald-100 text-emerald-800">
                <Globe className="w-3 h-3 mr-1" />
                {t('landing.badges.en16931')}
              </Badge>

              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="create-invoice-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t('invoices.new_invoice')}</span>
              </Button>

              <Button
                variant="outline"
                onClick={logout}
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t('auth.logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full overflow-x-auto lg:w-auto">
            <TabsTrigger value="dashboard" data-testid="dashboard-tab">
              <BarChart3 className="w-4 h-4 mr-2" />
              {t('navigation.dashboard')}
            </TabsTrigger>
            <TabsTrigger value="invoices" data-testid="invoices-tab">
              <FileText className="w-4 h-4 mr-2" />
              {t('navigation.invoices')}
            </TabsTrigger>
            <TabsTrigger value="countries" data-testid="countries-tab">
              <Globe className="w-4 h-4 mr-2" />
              {t('navigation.countries')}
            </TabsTrigger>
            <TabsTrigger value="integrations" data-testid="integrations-tab">
              <Settings className="w-4 h-4 mr-2" />
              {t('navigation.integrations')}
            </TabsTrigger>
            <TabsTrigger value="currencies" data-testid="currencies-tab">
              <DollarSign className="w-4 h-4 mr-2" />
              {t('navigation.currencies')}
            </TabsTrigger>
            <TabsTrigger value="billing" data-testid="billing-tab">
              <CreditCard className="w-4 h-4 mr-2" />
              {t('navigation.billing')}
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.total_invoices')}</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{invoices.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.invoices_created')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.compliance_rate')}</CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {invoices.length > 0
                      ? Math.round((invoices.filter(inv => compliantInvoiceStatuses.has(normalizeInvoiceStatus(inv.status))).length / invoices.length) * 100)
                      : 0
                    }%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.compliant_eu')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.supported_countries')}</CardTitle>
                  <Globe className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(countryRules).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    FR, DE, IT, ES, NL, LU...
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Affichage des résultats de validation avec nouveau composant */}
            <InvalidFieldsIndicator
              validationResult={validationResult}
              onFixFields={() => {
                const invoiceToEdit = invoices.find(inv => inv.id === validationResult.invoice_id);
                if (invoiceToEdit) {
                  fixInvalidFields(invoiceToEdit);
                }
              }}
            />

            {validationResult && (
              <Alert className={validationResult.status === 'valid' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
                {validationResult.status === 'valid' ?
                  <CheckCircle className="h-4 w-4 text-emerald-600" /> :
                  <XCircle className="h-4 w-4 text-red-600" />
                }
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {validationResult.status === 'valid' ? t('dashboard.invoice_compliant') : t('dashboard.invoice_not_compliant')}
                    </p>
                    {validationResult.errors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-700">{t('dashboard.detected_errors')}</p>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {validationResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validationResult.warnings.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-yellow-700">{t('dashboard.warnings')}</p>
                        <ul className="text-sm text-yellow-600 list-disc list-inside">
                          {validationResult.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>          {/* Factures */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <h2 className="text-2xl font-bold">{t('invoices.title')}</h2>
                <p className="text-slate-600">{t('invoices.description')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedInvoices.length > 0 && (
                  <div className="flex flex-wrap gap-2 sm:mr-4">
                    <Button
                      variant="outline"
                      onClick={() => bulkSignInvoices(selectedInvoices)}
                      disabled={loading}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {t('invoices.bulk_sign')} ({selectedInvoices.length})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => bulkSendInvoices(selectedInvoices)}
                      disabled={loading}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {t('invoices.bulk_send')} ({selectedInvoices.length})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedInvoices([])}
                    >
                      {t('common.clear_selection')}
                    </Button>
                  </div>
                )}
                <Button
                  onClick={loadInvoices}
                  variant="outline"
                  disabled={loading}
                  data-testid="refresh-invoices-btn"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {t('common.refresh')}
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {loading && invoices.length === 0 && (
                <Card className="p-8 text-center">
                  <RefreshCw className="w-6 h-6 text-slate-400 mx-auto mb-3 animate-spin" />
                  <p className="text-slate-500">{t('common.loading')}</p>
                </Card>
              )}

              {invoices.map((invoice) => (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">

                    {/* Top row: checkbox + invoice identity */}
                    <div className="flex items-start gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvoices(prev => [...prev, invoice.id]);
                          } else {
                            setSelectedInvoices(prev => prev.filter(id => id !== invoice.id));
                          }
                        }}
                        className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        {/* Invoice number + status badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold truncate">{invoice.invoice_number}</h3>
                          {getStatusBadge(invoice.status)}
                          <Badge variant="outline" className="text-xs">
                            {invoice.currency_code} · {invoice.country_code}
                          </Badge>
                          {invoice.signature_status === 'signed' && (
                            <Badge className="text-xs bg-green-600 text-white">
                              <Shield className="w-3 h-3 mr-1" />
                              {t('invoices.signed')}
                            </Badge>
                          )}
                          {finalSendingStatuses.has(invoice.sending_status) && (
                            <div className="flex gap-2">
                              <Badge className="text-xs bg-blue-600 text-white">
                                <Send className="w-3 h-3 mr-1" />
                                {invoice.sending_status === 'delivery_confirmed' ? t('status.delivered') : t('invoices.sent')}
                              </Badge>
                              {invoice.delivery_method && (
                                <Badge variant="outline" className="text-xs border-blue-600 text-blue-600">
                                  {invoice.delivery_method === 'peppol' ? 'Peppol' : 'Email'}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Supplier → Customer */}
                        <p className="text-sm text-slate-600 truncate">
                          <Building2 className="w-3.5 h-3.5 inline mr-1 flex-shrink-0" />
                          {invoice.supplier.name}
                          <span className="mx-1 text-slate-400">→</span>
                          {invoice.customer.name}
                        </p>

                        {/* Date + Amount */}
                        <div className="flex flex-wrap items-baseline gap-3 mt-1">
                          <p className="text-xs text-slate-500">
                            {t('invoices.issued_on')} {new Date(invoice.issue_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-bold text-slate-900">
                            {invoice.payable_amount?.toFixed(2) ?? '0.00'} {invoice.document_currency_code}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons — full width, wrapping */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => validateInvoice(invoice.id)}
                        disabled={loading}
                        data-testid={`validate-invoice-${invoice.id}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        {t('common.validate')}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportInvoice(invoice.id, 'ubl')}
                        data-testid={`export-invoice-${invoice.id}`}
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        XML
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewInvoice(invoice)}
                        data-testid={`view-invoice-${invoice.id}`}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        {t('common.view')}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editInvoice(invoice)}
                        data-testid={`edit-invoice-${invoice.id}`}
                      >
                        <Settings className="w-3.5 h-3.5 mr-1.5" />
                        {t('common.edit')}
                      </Button>

                      <Button
                        variant={invoice.signature_status === 'signed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => signInvoice(invoice.id)}
                        disabled={loading || invoice.signature_status === 'signed'}
                        data-testid={`sign-invoice-${invoice.id}`}
                      >
                        <Shield className="w-3.5 h-3.5 mr-1.5" />
                        {invoice.signature_status === 'signed' ? t('invoices.signed') : t('invoices.sign')}
                      </Button>

                      <Button
                        variant={finalSendingStatuses.has(invoice.sending_status) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => sendInvoice(invoice.id)}
                        disabled={loading || invoice.signature_status !== 'signed' || finalSendingStatuses.has(invoice.sending_status)}
                        data-testid={`send-invoice-${invoice.id}`}
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        {finalSendingStatuses.has(invoice.sending_status) ? t('invoices.sent') : t('invoices.send')}
                      </Button>

                      {/* Delete pushed to the right with ml-auto */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeletingInvoiceId(invoice.id);
                          setShowDeleteConfirmDialog(true);
                        }}
                        disabled={loading}
                        data-testid={`delete-invoice-${invoice.id}`}
                        className="sm:ml-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        {t('common.delete')}
                      </Button>
                    </div>

                    {/* Invalid fields indicator */}
                    {invoice.status === 'invalid' && validationResultsByInvoice[invoice.id] && (
                      <div className="mt-3">
                        <InvalidFieldsIndicator
                          validationResult={validationResultsByInvoice[invoice.id]}
                          onFixFields={() => fixInvalidFields(invoice)}
                        />
                      </div>
                    )}

                    {eReportingByInvoice[invoice.id] && (
                      <Alert className="mt-3 border-blue-200 bg-blue-50">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          {t('invoices.ereporting_ready')}
                        </AlertDescription>
                      </Alert>
                    )}

                    {normalizeInvoiceStatus(invoice.status) === 'rejected' && (invoice.rejection_reason || invoice.correction_suggestions?.length > 0) && (
                      <Alert className="mt-3 border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription>
                          <div className="space-y-1 text-sm">
                            {invoice.rejection_reason && <p>{invoice.rejection_reason}</p>}
                            {invoice.correction_suggestions?.length > 0 && (
                              <p>{invoice.correction_suggestions.join(' ')}</p>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                  </CardContent>
                </Card>
              ))}

              {invoices.length === 0 && !loading && (
                <Card className="p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">{t('invoices.no_invoices')}</p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="mt-4"
                    data-testid="create-first-invoice-btn"
                  >
                    {t('invoices.create_first')}
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Pays EU - Nouveau composant */}
          <TabsContent value="countries" className="space-y-6">
            <CountryManager />
          </TabsContent>

          {/* Intégrations - Nouveau composant */}
          <TabsContent value="integrations" className="space-y-6">
            <IntegrationManager supportedSystems={supportedSystems} />
          </TabsContent>

          {/* Currencies Management */}
          <TabsContent value="currencies" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{t('currencies.title')}</h2>
                <p className="text-slate-600">{t('currencies.description')}</p>
              </div>
              <Button onClick={openCreateCurrencyDialog}>
                <Plus className="w-4 h-4 mr-2" />
                {t('currencies.add_currency')}
              </Button>
            </div>

            <div className="grid gap-4">
              {loading && currencies.length === 0 && (
                <Card className="p-8 text-center">
                  <RefreshCw className="w-6 h-6 text-slate-400 mx-auto mb-3 animate-spin" />
                  <p className="text-slate-500">{t('common.loading')}</p>
                </Card>
              )}

              {currencies.map((currency) => (
                <Card key={currency.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold">{currency.code}</h3>
                          <Badge variant={currency.is_base_currency ? "default" : "outline"}>
                            {currency.is_base_currency ? t('currencies.base_currency') : t('currencies.foreign_currency')}
                          </Badge>
                        </div>
                        <p className="text-slate-600">{currency.name} ({currency.symbol})</p>
                        <p className="text-sm text-slate-500">
                          {t('currencies.exchange_rate')}: {currency.exchange_rate} {currency.symbol}/EUR
                        </p>
                        <p className="text-xs text-slate-400">
                          {t('currencies.last_updated')}: {new Date(currency.last_updated).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditCurrencyDialog(currency)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={currency.is_base_currency}
                          onClick={() => deleteCurrency(currency)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{t('currencies.refresh_rates')}</h3>
                    <p className="text-slate-600">{t('currencies.refresh_description')}</p>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await axios.post(`${API}/currencies/refresh-rates`, {}, {
                          headers: getAuthHeaders()
                        });
                        toast.success(t('currencies.rates_updated'));
                        loadCurrencies();
                      } catch (error) {
                        toast.error(t('common.error'));
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {t('currencies.refresh_now')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facturation */}
          <TabsContent value="billing" className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-2xl font-bold">{t('billing.title')}</h2>
                <p className="text-slate-600">{t('billing.description')}</p>
                {billingUsage && (
                  <p className="text-sm text-slate-500 mt-1">
                    {t('billing.sent_usage', {
                      count: billingUsage.sent_this_month,
                      limit: billingUsage.limit ?? t('billing.unlimited')
                    })}
                  </p>
                )}
              </div>
              {user?.subscription_plan !== 'free' && (
                <Button onClick={handleManageBilling} variant="outline" disabled={loading}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t('billing.manage_subscription')}
                </Button>
              )}
            </div>

            {billingUsage?.limit_reached && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>{t('billing.limit_reached')}</span>
                  <Button size="sm" onClick={() => handleUpgrade(billingUsage.next_plan)}>
                    {t('billing.upgrade')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className={user?.subscription_plan === 'free' ? 'border-indigo-600 ring-1 ring-indigo-600' : ''}>
                <CardHeader>
                  <CardTitle>{t('billing.free_plan')}</CardTitle>
                  <CardDescription>€0/month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Up to 5 invoices/month</li>
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Standard formats</li>
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Basic validation</li>
                  </ul>
                  <Button
                    className="w-full"
                    variant={user?.subscription_plan === 'free' ? 'secondary' : 'outline'}
                    disabled={user?.subscription_plan === 'free'}
                  >
                    {user?.subscription_plan === 'free' ? t('billing.current_plan') : t('billing.upgrade')}
                  </Button>
                </CardContent>
              </Card>

              <Card className={user?.subscription_plan === 'starter' ? 'border-indigo-600 ring-1 ring-indigo-600' : ''}>
                <CardHeader>
                  <CardTitle>{t('billing.starter_plan')}</CardTitle>
                  <CardDescription>{t('billing.pricing.starter')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="text-sm space-y-2">
                    {t('billing.features.starter', { returnObjects: true }).map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => handleUpgrade('starter')}
                    disabled={loading || user?.subscription_plan === 'starter'}
                  >
                    {user?.subscription_plan === 'starter' ? t('billing.current_plan') : t('billing.upgrade')}
                  </Button>
                </CardContent>
              </Card>

              <Card className={user?.subscription_plan === 'pro' ? 'border-indigo-600 ring-1 ring-indigo-600' : ''}>
                <CardHeader>
                  <CardTitle>{t('billing.pro_plan')}</CardTitle>
                  <CardDescription>{t('billing.pricing.pro')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="text-sm space-y-2">
                    {t('billing.features.pro', { returnObjects: true }).map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => handleUpgrade('pro')}
                    disabled={loading || user?.subscription_plan === 'pro'}
                  >
                    {user?.subscription_plan === 'pro' ? t('billing.current_plan') : t('billing.upgrade')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogues de création de facture simplifiés */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('invoices.new_invoice')}</DialogTitle>
            <DialogDescription>
              Créer une nouvelle facture conforme EU
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); createInvoice(); }} className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('invoices.invoice_number')} *</Label>
                <Input
                  value={invoiceForm.invoice_number}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                  placeholder="INV-2025-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('invoices.issue_date')} *</Label>
                <Input
                  type="date"
                  value={invoiceForm.issue_date}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, issue_date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('invoices.due_date')}</Label>
                <Input
                  type="date"
                  value={invoiceForm.due_date}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('invoices.country')} *</Label>
                <Select
                  value={invoiceForm.country_code}
                  onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, country_code: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {getCountryName(country.code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('invoices.format')} *</Label>
                <Select
                  value={invoiceForm.format}
                  onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UBL_2.1">UBL 2.1 (Peppol)</SelectItem>
                    <SelectItem value="CII_D16B">UN/CEFACT CII</SelectItem>
                    <SelectItem value="FACTUR-X_MINIMUM">Factur-X Minimum</SelectItem>
                    <SelectItem value="FACTUR-X_BASIC">Factur-X Basic</SelectItem>
                    <SelectItem value="FACTUR-X_BASIC-WL">Factur-X Basic WL</SelectItem>
                    <SelectItem value="FACTUR-X_EN16931">Factur-X EN16931</SelectItem>
                    <SelectItem value="FACTUR-X_EXTENDED">Factur-X Extended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('invoices.currency')} *</Label>
                <Select
                  value={invoiceForm.currency_code}
                  onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, currency_code: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fournisseur */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('invoices.supplier_info')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('invoices.name')} *</Label>
                  <Input
                    value={invoiceForm.supplier.name}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, name: e.target.value }
                    }))}
                    placeholder="Nom du fournisseur"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.country')} *</Label>
                  <Select
                    value={invoiceForm.supplier.address.country_code}
                    onValueChange={(value) => setInvoiceForm(prev => ({
                      ...prev,
                      supplier: {
                        ...prev.supplier,
                        address: { ...prev.supplier.address, country_code: value }
                      }
                    }))}
                  >
                    <SelectTrigger data-testid="supplier-country-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent data-testid="supplier-country-options">
                      {COUNTRY_OPTIONS.map(country => (
                        <SelectItem
                          key={country.code}
                          value={country.code}
                          data-testid={`supplier-country-${country.code.toLowerCase()}`}
                        >
                          {getCountryName(country.code)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {t('invoices.vat_id')}
                    {requiredFields.includes('supplier.vat_id') && <span className="text-red-500 ml-1" data-testid="supplier-vat-required">*</span>}
                  </Label>
                  <Input
                    data-testid="supplier-vat-input"
                    value={invoiceForm.supplier.vat_id}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, vat_id: e.target.value }
                    }))}
                    placeholder={
                      countryInfo.supplier?.rules?.vat_id_pattern ?
                        `${invoiceForm.supplier.address.country_code}12345678901` :
                        "FR12345678901"
                    }
                    required={requiredFields.includes('supplier.vat_id')}
                  />
                  {countryInfo.supplier?.rules?.vat_id_pattern && (
                    <p className="text-xs text-slate-500">
                      Format: {countryInfo.supplier.rules.vat_id_pattern}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    {t('invoices.tax_id')}
                    {requiredFields.includes('supplier.tax_id') && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    value={invoiceForm.supplier.tax_id}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, tax_id: e.target.value }
                    }))}
                    placeholder="Numéro d'identification fiscale"
                    required={requiredFields.includes('supplier.tax_id')}
                  />
                </div>
                {invoiceForm.supplier.address.country_code === 'FR' && (
                  <div className="space-y-2">
                    <Label>SIRET</Label>
                    <Input
                      value={invoiceForm.supplier.siret}
                      onChange={(e) => setInvoiceForm(prev => ({
                        ...prev,
                        supplier: { ...prev.supplier, siret: e.target.value }
                      }))}
                      placeholder="12345678901234"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Peppol ID</Label>
                  <div className="flex gap-2">
                    <Select
                      value={invoiceForm.supplier.peppol_scheme}
                      onValueChange={(value) => setInvoiceForm(prev => ({
                        ...prev,
                        supplier: { ...prev.supplier, peppol_scheme: value }
                      }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        {PEPPOL_SCHEME_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="flex-1"
                      value={invoiceForm.supplier.peppol_id}
                      onChange={(e) => setInvoiceForm(prev => ({
                        ...prev,
                        supplier: { ...prev.supplier, peppol_id: e.target.value }
                      }))}
                      placeholder="Identifier"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.street')}</Label>
                  <Input
                    value={invoiceForm.supplier.address.street_name}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      supplier: {
                        ...prev.supplier,
                        address: { ...prev.supplier.address, street_name: e.target.value }
                      }
                    }))}
                    placeholder="123 Rue de la Paix"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.city')}</Label>
                  <Input
                    value={invoiceForm.supplier.address.city_name}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      supplier: {
                        ...prev.supplier,
                        address: { ...prev.supplier.address, city_name: e.target.value }
                      }
                    }))}
                    placeholder="Paris"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.postal_code')}</Label>
                  <Input
                    value={invoiceForm.supplier.address.postal_code}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      supplier: {
                        ...prev.supplier,
                        address: { ...prev.supplier.address, postal_code: e.target.value }
                      }
                    }))}
                    placeholder="75001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.contact_email')}</Label>
                  <Input
                    type="email"
                    value={invoiceForm.supplier.contact_email}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, contact_email: e.target.value }
                    }))}
                    placeholder="contact@entreprise.fr"
                  />
                </div>
              </div>
            </div>

            {/* Client */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('invoices.customer_info')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('invoices.name')} *</Label>
                  <Input
                    value={invoiceForm.customer.name}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      customer: { ...prev.customer, name: e.target.value }
                    }))}
                    placeholder="Nom du client"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.country')} *</Label>
                  <Select
                    value={invoiceForm.customer.address.country_code}
                    onValueChange={(value) => setInvoiceForm(prev => ({
                      ...prev,
                      customer: {
                        ...prev.customer,
                        address: { ...prev.customer.address, country_code: value }
                      }
                    }))}
                  >
                    <SelectTrigger data-testid="customer-country-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent data-testid="customer-country-options">
                      {COUNTRY_OPTIONS.map(country => (
                        <SelectItem
                          key={country.code}
                          value={country.code}
                          data-testid={`customer-country-${country.code.toLowerCase()}`}
                        >
                          {getCountryName(country.code)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {t('invoices.vat_id')}
                    {requiredFields.includes('customer.vat_id') && <span className="text-red-500 ml-1" data-testid="customer-vat-required">*</span>}
                  </Label>
                  <Input
                    data-testid="customer-vat-input"
                    value={invoiceForm.customer.vat_id}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      customer: { ...prev.customer, vat_id: e.target.value }
                    }))}
                    placeholder={
                      countryInfo.customer?.rules?.vat_id_pattern ?
                        `${invoiceForm.customer.address.country_code}98765432109` :
                        "FR98765432109"
                    }
                    required={requiredFields.includes('customer.vat_id')}
                  />
                  {countryInfo.customer?.rules?.vat_id_pattern && (
                    <p className="text-xs text-slate-500">
                      Format: {countryInfo.customer.rules.vat_id_pattern}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    {t('invoices.tax_id')}
                    {requiredFields.includes('customer.tax_id') && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    value={invoiceForm.customer.tax_id}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      customer: { ...prev.customer, tax_id: e.target.value }
                    }))}
                    placeholder="Numéro d'identification fiscale"
                    required={requiredFields.includes('customer.tax_id')}
                  />
                </div>
                {invoiceForm.customer.address.country_code === 'FR' && (
                  <div className="space-y-2">
                    <Label>SIRET</Label>
                    <Input
                      value={invoiceForm.customer.siret}
                      onChange={(e) => setInvoiceForm(prev => ({
                        ...prev,
                        customer: { ...prev.customer, siret: e.target.value }
                      }))}
                      placeholder="12345678901234"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Peppol ID</Label>
                  <div className="flex gap-2">
                    <Select
                      value={invoiceForm.customer.peppol_scheme}
                      onValueChange={(value) => setInvoiceForm(prev => ({
                        ...prev,
                        customer: { ...prev.customer, peppol_scheme: value }
                      }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        {PEPPOL_SCHEME_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="flex-1"
                      value={invoiceForm.customer.peppol_id}
                      onChange={(e) => setInvoiceForm(prev => ({
                        ...prev,
                        customer: { ...prev.customer, peppol_id: e.target.value }
                      }))}
                      placeholder="Identifier"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.street')}</Label>
                  <Input
                    value={invoiceForm.customer.address.street_name}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      customer: {
                        ...prev.customer,
                        address: { ...prev.customer.address, street_name: e.target.value }
                      }
                    }))}
                    placeholder="456 Avenue des Champs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.city')}</Label>
                  <Input
                    value={invoiceForm.customer.address.city_name}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      customer: {
                        ...prev.customer,
                        address: { ...prev.customer.address, city_name: e.target.value }
                      }
                    }))}
                    placeholder="Lyon"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.postal_code')}</Label>
                  <Input
                    value={invoiceForm.customer.address.postal_code}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      customer: {
                        ...prev.customer,
                        address: { ...prev.customer.address, postal_code: e.target.value }
                      }
                    }))}
                    placeholder="69001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.contact_email')}</Label>
                  <Input
                    type="email"
                    value={invoiceForm.customer.contact_email}
                    onChange={(e) => setInvoiceForm(prev => ({
                      ...prev,
                      customer: { ...prev.customer, contact_email: e.target.value }
                    }))}
                    placeholder="client@entreprise.fr"
                  />
                </div>
              </div>
            </div>

            {/* Required Fields Info */}
            {requiredFields.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  {t('invoices.required_fields_info')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {requiredFields.map((field) => (
                    <Badge key={field} variant="outline" className="bg-blue-100 text-blue-800">
                      {field.replace('.', ' → ')}
                    </Badge>
                  ))}
                </div>
                {loadingRequiredFields && (
                  <div className="flex items-center mt-2 text-sm text-blue-600">
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    {t('invoices.updating_requirements')}
                  </div>
                )}
              </div>
            )}

            {/* Informations de paiement */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('invoices.payment_info')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    {t('invoices.payment_terms')}
                    {requiredFields.includes('payment_terms') && <span className="text-red-500 ml-1" data-testid="payment-terms-required">*</span>}
                  </Label>
                  <Input
                    data-testid="payment-terms-input"
                    value={invoiceForm.payment_terms}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_terms: e.target.value }))}
                    placeholder="30 jours net"
                    required={requiredFields.includes('payment_terms')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.order_reference')}</Label>
                  <Input
                    value={invoiceForm.order_reference}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, order_reference: e.target.value }))}
                    placeholder="BC-2025-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract Reference</Label>
                  <Input
                    value={invoiceForm.contract_reference}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, contract_reference: e.target.value }))}
                    placeholder="CONTRACT-123"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Purchase Order Reference</Label>
                  <Input
                    value={invoiceForm.purchase_order_ref}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, purchase_order_ref: e.target.value }))}
                    placeholder="PO-456"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Buyer Reference (BT-10)</Label>
                  <Input
                    value={invoiceForm.buyer_reference}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, buyer_reference: e.target.value }))}
                    placeholder="Cost Center / Reference"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.recipient_email')}</Label>
                  <Input
                    type="email"
                    value={invoiceForm.recipient_email}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, recipient_email: e.target.value }))}
                    placeholder="client@entreprise.com"
                  />
                </div>
              </div>
            </div>

            {/* Lignes de facture */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{t('invoices.invoice_lines')}</h3>
                <Button type="button" variant="outline" onClick={addInvoiceLine}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('invoices.add_line')}
                </Button>
              </div>

              {invoiceForm.invoice_lines.map((line, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>{t('invoices.item_name')} *</Label>
                    <Input
                      value={line.item_name}
                      onChange={(e) => {
                        const newLines = [...invoiceForm.invoice_lines];
                        newLines[index].item_name = e.target.value;
                        setInvoiceForm(prev => ({ ...prev, invoice_lines: newLines }));
                      }}
                      placeholder="Article ou service"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('invoices.quantity')} *</Label>
                    <Input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => {
                        const newLines = [...invoiceForm.invoice_lines];
                        newLines[index].quantity = parseFloat(e.target.value) || 0;
                        setInvoiceForm(prev => ({ ...prev, invoice_lines: newLines }));
                      }}
                      placeholder="1"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('invoices.unit_price')} *</Label>
                    <Input
                      type="number"
                      value={line.price_amount}
                      onChange={(e) => {
                        const newLines = [...invoiceForm.invoice_lines];
                        newLines[index].price_amount = parseFloat(e.target.value) || 0;
                        setInvoiceForm(prev => ({ ...prev, invoice_lines: newLines }));
                      }}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('invoices.tax_rate')} (%)</Label>
                    <Input
                      type="number"
                      value={line.tax_category.percent}
                      onChange={(e) => {
                        const newLines = [...invoiceForm.invoice_lines];
                        newLines[index].tax_category.percent = parseFloat(e.target.value) || 0;
                        setInvoiceForm(prev => ({ ...prev, invoice_lines: newLines }));
                      }}
                      placeholder="20"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowPreviewDialog(true)} disabled={loading}>
                <Eye className="w-4 h-4 mr-2" />
                {t('invoices.preview')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de visualisation simplifiée */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('invoices.view_details')}</DialogTitle>
            <DialogDescription>
              Détails de la facture {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">{t('invoices.invoice_number')}</p>
                  <p>{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">{t('invoices.status')}</p>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">{t('invoices.issue_date')}</p>
                  <p>{new Date(selectedInvoice.issue_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">{t('invoices.amount')}</p>
                  <p className="text-lg font-bold">{selectedInvoice.payable_amount?.toFixed(2)} {selectedInvoice.document_currency_code}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">{t('invoices.supplier')}</p>
                  <p>{selectedInvoice.supplier.name}</p>
                  {selectedInvoice.supplier.vat_id && <p className="text-sm text-slate-500">TVA: {selectedInvoice.supplier.vat_id}</p>}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">{t('invoices.customer')}</p>
                  <p>{selectedInvoice.customer.name}</p>
                  {selectedInvoice.customer.vat_id && <p className="text-sm text-slate-500">TVA: {selectedInvoice.customer.vat_id}</p>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition simple (pour les champs invalides) */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('invoices.edit_invoice')}</DialogTitle>
            <DialogDescription>
              Modifier la facture {editingInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>

          {editingInvoice && (
            <form onSubmit={(e) => {
              e.preventDefault();
              updateInvoice(editingInvoice.id, editingInvoice);
            }} className="space-y-4">
              <InvalidFieldsIndicator
                validationResult={validationResultsByInvoice[editingInvoice.id]}
                onFixFields={null}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('invoices.due_date')}</Label>
                  <Input
                    type="date"
                    value={editingInvoice.due_date ? editingInvoice.due_date.split('T')[0] : ''}
                    onChange={(e) => setEditingInvoice(prev => ({
                      ...prev,
                      due_date: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.recipient_email')}</Label>
                  <Input
                    type="email"
                    value={editingInvoice.recipient_email || ''}
                    onChange={(e) => setEditingInvoice(prev => ({
                      ...prev,
                      recipient_email: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.supplier')} - {t('invoices.name')} *</Label>
                  <Input
                    value={editingInvoice.supplier.name}
                    onChange={(e) => setEditingInvoice(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, name: e.target.value }
                    }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.supplier')} - {t('invoices.vat_id')}</Label>
                  <Input
                    value={editingInvoice.supplier.vat_id || ''}
                    onChange={(e) => setEditingInvoice(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, vat_id: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.supplier')} - {t('invoices.tax_id')}</Label>
                  <Input
                    value={editingInvoice.supplier.tax_id || ''}
                    onChange={(e) => setEditingInvoice(prev => ({
                      ...prev,
                      supplier: { ...prev.supplier, tax_id: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.customer')} - {t('invoices.name')} *</Label>
                  <Input
                    value={editingInvoice.customer.name}
                    onChange={(e) => setEditingInvoice(prev => ({
                      ...prev,
                      customer: { ...prev.customer, name: e.target.value }
                    }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.customer')} - {t('invoices.vat_id')}</Label>
                  <Input
                    value={editingInvoice.customer.vat_id || ''}
                    onChange={(e) => setEditingInvoice(prev => ({
                      ...prev,
                      customer: { ...prev.customer, vat_id: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.customer')} - {t('invoices.tax_id')}</Label>
                  <Input
                    value={editingInvoice.customer.tax_id || ''}
                    onChange={(e) => setEditingInvoice(prev => ({
                      ...prev,
                      customer: { ...prev.customer, tax_id: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('invoices.payment_terms')}</Label>
                  <Input
                    value={editingInvoice.payment_terms || ''}
                    onChange={(e) => setEditingInvoice(prev => ({
                      ...prev,
                      payment_terms: e.target.value
                    }))}
                    placeholder="30 jours net"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('invoices.preview')}</DialogTitle>
            <DialogDescription>
              Aperçu de la facture avant soumission
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">{t('invoices.invoice_number')}</p>
                <p className="text-slate-600">{invoiceForm.invoice_number}</p>
              </div>
              <div>
                <p className="font-medium">{t('invoices.issue_date')}</p>
                <p className="text-slate-600">{invoiceForm.issue_date}</p>
              </div>
            </div>

            {/* Supplier */}
            <div>
              <h4 className="font-medium mb-2">{t('invoices.supplier_info')}</h4>
              <div className="bg-slate-50 p-3 rounded">
                <p><strong>{invoiceForm.supplier.name}</strong></p>
                <p>{invoiceForm.supplier.address.street_name}</p>
                <p>{invoiceForm.supplier.address.postal_code} {invoiceForm.supplier.address.city_name}</p>
                <p>{t('invoices.country')}: {invoiceForm.supplier.address.country_code}</p>
                {invoiceForm.supplier.vat_id && <p>{t('invoices.vat_id')}: {invoiceForm.supplier.vat_id}</p>}
              </div>
            </div>

            {/* Customer */}
            <div>
              <h4 className="font-medium mb-2">{t('invoices.customer_info')}</h4>
              <div className="bg-slate-50 p-3 rounded">
                <p><strong>{invoiceForm.customer.name}</strong></p>
                <p>{invoiceForm.customer.address.street_name}</p>
                <p>{invoiceForm.customer.address.postal_code} {invoiceForm.customer.address.city_name}</p>
                <p>{t('invoices.country')}: {invoiceForm.customer.address.country_code}</p>
                {invoiceForm.customer.vat_id && <p>{t('invoices.vat_id')}: {invoiceForm.customer.vat_id}</p>}
              </div>
            </div>

            {/* Payment Terms */}
            {invoiceForm.payment_terms && (
              <div>
                <h4 className="font-medium mb-2">{t('invoices.payment_terms')}</h4>
                <p className="bg-slate-50 p-3 rounded">{invoiceForm.payment_terms}</p>
              </div>
            )}

            {/* Required Fields Status */}
            {requiredFields.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Statut des champs obligatoires</h4>
                <div className="space-y-2">
                  {requiredFields.map(field => {
                    const fieldPath = field.split('.');
                    let value = invoiceForm;
                    for (const part of fieldPath) {
                      value = value?.[part];
                    }
                    const isComplete = value && value.toString().trim() !== '';

                    return (
                      <div key={field} className="flex items-center space-x-2">
                        {isComplete ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={isComplete ? 'text-green-800' : 'text-red-800'}>
                          {field.replace('.', ' → ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => setShowPreviewDialog(false)}>
              {t('common.close')}
            </Button>
            <Button
              onClick={() => {
                setShowPreviewDialog(false);
                createInvoice();
              }}
              disabled={loading}
            >
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Currency Dialog */}
      <Dialog open={showCurrencyDialog} onOpenChange={setShowCurrencyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCurrency ? t('currencies.edit_currency') : t('currencies.add_currency')}
            </DialogTitle>
            <DialogDescription>
              {editingCurrency ? t('currencies.edit_description') : t('currencies.create_description')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); saveCurrency(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('currencies.code')} *</Label>
              <Input
                value={currencyForm.code}
                onChange={(e) => setCurrencyForm(prev => ({
                  ...prev,
                  code: e.target.value.toUpperCase().slice(0, 8)
                }))}
                placeholder="USD"
                disabled={Boolean(editingCurrency)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('currencies.name')} *</Label>
              <Input
                value={currencyForm.name}
                onChange={(e) => setCurrencyForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="US Dollar"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('currencies.symbol')} *</Label>
              <Input
                value={currencyForm.symbol}
                onChange={(e) => setCurrencyForm(prev => ({ ...prev, symbol: e.target.value }))}
                placeholder="$"
                required
              />
            </div>
            {editingCurrency && (
              <div className="space-y-2">
                <Label>{t('currencies.exchange_rate')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.000001"
                  value={currencyForm.exchange_rate}
                  onChange={(e) => setCurrencyForm(prev => ({
                    ...prev,
                    exchange_rate: e.target.value
                  }))}
                />
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCurrencyDialog(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">{t('invoices.confirm_delete')}</DialogTitle>
            <DialogDescription>
              {t('invoices.delete_warning')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {t('invoices.permanent_deletion')}
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    {t('invoices.cannot_be_undone')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirmDialog(false);
                  setDeletingInvoiceId(null);
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteInvoiceSecurely(deletingInvoiceId)}
                disabled={loading}
              >
                {loading ? t('common.loading') : t('common.delete')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

// Composant de protection des routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AnalyticsPageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
};

// App principal avec routing
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <ThemeProvider attribute="class">
          <BrowserRouter>
          <AnalyticsPageTracker />
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/docs/compliance-roadmap" element={<DocsPage focus="roadmap" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />

            {/* Routes protégées */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <EInvoicePro />
              </ProtectedRoute>
            } />

            {/* Redirection par défaut */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
