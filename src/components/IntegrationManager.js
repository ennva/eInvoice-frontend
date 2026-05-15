import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Building2, Settings, TestTube, CheckCircle, XCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API, getBackendErrorMessage } from '../lib/api';

const IntegrationManager = ({ supportedSystems }) => {
  const { t } = useTranslation();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [editingConfig, setEditingConfig] = useState(null);
  
  const [configForm, setConfigForm] = useState({
    system_code: '',
    config: {},
    credentials: {}
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/integrations/configs`);
      setIntegrations(response.data);
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const openConfigDialog = (system, existingConfig = null) => {
    setSelectedSystem(system);
    setEditingConfig(existingConfig);
    
    if (existingConfig) {
      setConfigForm({
        system_code: existingConfig.system_code,
        config: existingConfig.config || {},
        credentials: existingConfig.credentials || {}
      });
    } else {
      setConfigForm({
        system_code: system.code,
        config: getDefaultConfig(system.code),
        credentials: getDefaultCredentials(system.code)
      });
    }
    setShowConfigDialog(true);
  };

  const getDefaultConfig = (systemCode) => {
    switch (systemCode.toLowerCase()) {
      case 'sage':
        return {
          api_url: '',
          sync_direction: 'bidirectional',
          sync_frequency: 'daily',
          modules: ['invoicing', 'customers']
        };
      case 'sap':
        return {
          sap_client: '',
          sap_language: 'FR',
          sync_direction: 'bidirectional',
          sync_frequency: 'hourly'
        };
      case 'cegid':
        return {
          database_name: '',
          sync_direction: 'bidirectional',
          sync_frequency: 'daily'
        };
      case 'quadratus':
        return {
          file_path: '',
          sync_direction: 'export_only',
          sync_frequency: 'manual'
        };
      case 'generic':
        return {
          api_url: '',
          api_version: 'v1',
          sync_direction: 'bidirectional',
          sync_frequency: 'daily'
        };
      default:
        return {
          sync_direction: 'bidirectional',
          sync_frequency: 'daily'
        };
    }
  };

  const getDefaultCredentials = (systemCode) => {
    switch (systemCode.toLowerCase()) {
      case 'sage':
      case 'generic':
        return {
          api_key: '',
          username: '',
          password: ''
        };
      case 'sap':
        return {
          username: '',
          password: '',
          client_id: '',
          client_secret: ''
        };
      case 'cegid':
        return {
          database_user: '',
          database_password: '',
          server_host: ''
        };
      case 'quadratus':
        return {
          license_key: '',
          export_path: ''
        };
      default:
        return {
          username: '',
          password: ''
        };
    }
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingConfig) {
        await axios.put(`${API}/integrations/configs/${editingConfig.id}`, {
          config: configForm.config,
          credentials: configForm.credentials
        });
        toast.success(t('integrations.config_saved'));
      } else {
        await axios.post(`${API}/integrations/configs`, configForm);
        toast.success(t('integrations.config_saved'));
      }
      
      setShowConfigDialog(false);
      setSelectedSystem(null);
      setEditingConfig(null);
      loadIntegrations();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (configId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/integrations/configs/${configId}/test`);
      
      if (response.data.test_status === 'success') {
        toast.success(t('integrations.test_success'));
      } else {
        toast.error(response.data.message || t('integrations.connection_error', { system: response.data.system_code }));
      }
      
      loadIntegrations();
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error(getBackendErrorMessage(
        error,
        t('integrations.connection_error', { system: 'Unknown' })
      ));
    } finally {
      setLoading(false);
    }
  };

  const deleteIntegration = async (configId) => {
    if (!window.confirm(t('common.confirm'))) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API}/integrations/configs/${configId}`);
      toast.success('Configuration supprimée');
      loadIntegrations();
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const renderConfigFields = () => {
    if (!selectedSystem) return null;

    const systemCode = selectedSystem.code.toLowerCase();
    const config = configForm.config;
    const credentials = configForm.credentials;

    const updateConfig = (key, value) => {
      setConfigForm(prev => ({
        ...prev,
        config: { ...prev.config, [key]: value }
      }));
    };

    const updateCredentials = (key, value) => {
      setConfigForm(prev => ({
        ...prev,
        credentials: { ...prev.credentials, [key]: value }
      }));
    };

    return (
      <div className="space-y-6">
        {/* Configuration Section */}
        <div>
          <h4 className="text-sm font-semibold mb-3">{t('integrations.configuration')}</h4>
          <div className="space-y-3">
            {systemCode === 'sage' && (
              <>
                <div className="space-y-2">
                  <Label>{t('integrations.api_url')} *</Label>
                  <Input
                    value={config.api_url || ''}
                    onChange={(e) => updateConfig('api_url', e.target.value)}
                    placeholder="https://api.sage.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t('integrations.sync_direction')}</Label>
                    <Select value={config.sync_direction} onValueChange={(value) => updateConfig('sync_direction', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bidirectional">{t('integrations.bidirectional')}</SelectItem>
                        <SelectItem value="import_only">{t('integrations.import_only')}</SelectItem>
                        <SelectItem value="export_only">{t('integrations.export_only')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('integrations.sync_frequency')}</Label>
                    <Select value={config.sync_frequency} onValueChange={(value) => updateConfig('sync_frequency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">{t('integrations.manual')}</SelectItem>
                        <SelectItem value="hourly">{t('integrations.hourly')}</SelectItem>
                        <SelectItem value="daily">{t('integrations.daily')}</SelectItem>
                        <SelectItem value="weekly">{t('integrations.weekly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
            
            {systemCode === 'sap' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>SAP Client *</Label>
                    <Input
                      value={config.sap_client || ''}
                      onChange={(e) => updateConfig('sap_client', e.target.value)}
                      placeholder="100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SAP Language</Label>
                    <Select value={config.sap_language} onValueChange={(value) => updateConfig('sap_language', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FR">Français</SelectItem>
                        <SelectItem value="EN">English</SelectItem>
                        <SelectItem value="DE">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {systemCode === 'cegid' && (
              <div className="space-y-2">
                <Label>{t('integrations.database_name')} *</Label>
                <Input
                  value={config.database_name || ''}
                  onChange={(e) => updateConfig('database_name', e.target.value)}
                  placeholder="CEGID_DB"
                  required
                />
              </div>
            )}

            {systemCode === 'generic' && (
              <>
                <div className="space-y-2">
                  <Label>{t('integrations.api_url')} *</Label>
                  <Input
                    value={config.api_url || ''}
                    onChange={(e) => updateConfig('api_url', e.target.value)}
                    placeholder="https://api.example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Version</Label>
                  <Input
                    value={config.api_version || ''}
                    onChange={(e) => updateConfig('api_version', e.target.value)}
                    placeholder="v1"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Credentials Section */}
        <div>
          <h4 className="text-sm font-semibold mb-3">{t('integrations.credentials')}</h4>
          <div className="space-y-3">
            {(systemCode === 'sage' || systemCode === 'generic') && (
              <>
                <div className="space-y-2">
                  <Label>{t('integrations.api_key')} *</Label>
                  <Input
                    type="password"
                    value={credentials.api_key || ''}
                    onChange={(e) => updateCredentials('api_key', e.target.value)}
                    placeholder="••••••••••••••••"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t('integrations.username')}</Label>
                    <Input
                      value={credentials.username || ''}
                      onChange={(e) => updateCredentials('username', e.target.value)}
                      placeholder="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={credentials.password || ''}
                      onChange={(e) => updateCredentials('password', e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </>
            )}

            {systemCode === 'sap' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t('integrations.username')} *</Label>
                    <Input
                      value={credentials.username || ''}
                      onChange={(e) => updateCredentials('username', e.target.value)}
                      placeholder="SAP_USER"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      value={credentials.password || ''}
                      onChange={(e) => updateCredentials('password', e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t('integrations.client_id')}</Label>
                    <Input
                      value={credentials.client_id || ''}
                      onChange={(e) => updateCredentials('client_id', e.target.value)}
                      placeholder="CLIENT_ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('integrations.client_secret')}</Label>
                    <Input
                      type="password"
                      value={credentials.client_secret || ''}
                      onChange={(e) => updateCredentials('client_secret', e.target.value)}
                      placeholder="••••••••••••••••"
                    />
                  </div>
                </div>
              </>
            )}

            {systemCode === 'cegid' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Database User *</Label>
                    <Input
                      value={credentials.database_user || ''}
                      onChange={(e) => updateCredentials('database_user', e.target.value)}
                      placeholder="db_user"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Database Password *</Label>
                    <Input
                      type="password"
                      value={credentials.database_password || ''}
                      onChange={(e) => updateCredentials('database_password', e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('integrations.database_host')} *</Label>
                  <Input
                    value={credentials.server_host || ''}
                    onChange={(e) => updateCredentials('server_host', e.target.value)}
                    placeholder="localhost:1433"
                    required
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getStatusBadge = (integration) => {
    const isActive = integration.is_active;
    const hasRecentSync = integration.last_sync && 
      new Date(integration.last_sync) > new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (isActive && hasRecentSync) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else if (isActive) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Settings className="w-3 h-3 mr-1" />
          Configuré
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Inactif
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">{t('integrations.title')}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {supportedSystems?.map((system) => {
          const existingConfig = integrations.find(integration => 
            integration.system_code.toLowerCase() === system.code.toLowerCase()
          );

          return (
            <Card key={system.code} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>{system.name}</span>
                  </div>
                  {existingConfig && getStatusBadge(existingConfig)}
                </CardTitle>
                <CardDescription>
                  {t('integrations.integration_type')}: {system.integration_type}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">{t('integrations.supported_versions')}:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {system.versions.map((version) => (
                        <Badge key={version} variant="outline" className="text-xs">
                          {version}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {existingConfig && (
                    <div className="text-sm text-slate-600">
                      {existingConfig.last_sync && (
                        <p>{t('integrations.last_sync')}: {new Date(existingConfig.last_sync).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {existingConfig ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openConfigDialog(system, existingConfig)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection(existingConfig.id)}
                          disabled={loading}
                        >
                          <TestTube className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteIntegration(existingConfig.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => openConfigDialog(system)}
                        className="w-full"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {t('integrations.connect', { system: system.name })}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig 
                ? t('integrations.edit_integration')
                : t('integrations.configure_integration', { system: selectedSystem?.name })
              }
            </DialogTitle>
            <DialogDescription>
              {editingConfig 
                ? `Modifier la configuration de ${selectedSystem?.name}`
                : `Configurer la connexion avec ${selectedSystem?.name}`
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfigSubmit}>
            {renderConfigFields()}
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowConfigDialog(false);
                  setSelectedSystem(null);
                  setEditingConfig(null);
                }}
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
    </div>
  );
};

export default IntegrationManager;
