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
import { Plus, Edit, Trash2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { API, getBackendErrorMessage } from '../lib/api';

const CountryManager = () => {
  const { t } = useTranslation();
  const [countries, setCountries] = useState({ builtin_countries: [], custom_countries: [] });
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    name_en: '',
    region: 'EU',
    vat_id_required: false,
    vat_id_pattern: '',
    mandatory_fields: []
  });

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/countries/extended`);
      setCountries(response.data);
    } catch (error) {
      console.error('Error loading countries:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingCountry) {
        await axios.put(`${API}/countries/custom/${editingCountry.code}`, formData);
        toast.success(t('countries.updated_success'));
        setShowEditDialog(false);
      } else {
        await axios.post(`${API}/countries/custom`, formData);
        toast.success(t('countries.created_success'));
        setShowAddDialog(false);
      }
      
      resetForm();
      loadCountries();
    } catch (error) {
      console.error('Error saving country:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (country) => {
    setEditingCountry(country);
    setFormData({
      code: country.code,
      name: country.name,
      name_en: country.name_en || '',
      region: country.region,
      vat_id_required: country.vat_id_required || false,
      vat_id_pattern: country.vat_id_pattern || '',
      mandatory_fields: country.mandatory_fields || []
    });
    setShowEditDialog(true);
  };

  const handleDelete = async (countryCode) => {
    if (!window.confirm(t('common.confirm'))) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API}/countries/custom/${countryCode}`);
      toast.success(t('countries.deleted_success'));
      loadCountries();
    } catch (error) {
      console.error('Error deleting country:', error);
      toast.error(getBackendErrorMessage(error, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      name_en: '',
      region: 'EU',
      vat_id_required: false,
      vat_id_pattern: '',
      mandatory_fields: []
    });
    setEditingCountry(null);
  };

  const getRegionBadgeClass = (region) => {
    switch (region) {
      case 'EU':
        return 'bg-blue-100 text-blue-800';
      case 'EEA':
        return 'bg-green-100 text-green-800';
      case 'EXTRA_EU':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">{t('countries.title')}</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              {t('countries.add_country')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('countries.add_country')}</DialogTitle>
              <DialogDescription>
                Ajouter une nouvelle règle de pays personnalisée
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">{t('countries.country_code')} *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="FR, DE, etc."
                    required
                    maxLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">{t('countries.region')} *</Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EU">{t('countries.regions.EU')}</SelectItem>
                      <SelectItem value="EEA">{t('countries.regions.EEA')}</SelectItem>
                      <SelectItem value="EXTRA_EU">{t('countries.regions.EXTRA_EU')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('countries.country_name')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom en français"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">{t('countries.country_name_en')}</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="Name in English"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vat_pattern">{t('countries.vat_pattern')}</Label>
                <Input
                  id="vat_pattern"
                  value={formData.vat_id_pattern}
                  onChange={(e) => setFormData(prev => ({ ...prev, vat_id_pattern: e.target.value }))}
                  placeholder="FR[0-9A-Z]{2}[0-9]{9}"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="vat_required"
                  checked={formData.vat_id_required}
                  onChange={(e) => setFormData(prev => ({ ...prev, vat_id_required: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="vat_required">{t('countries.vat_required')}</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => { resetForm(); setShowAddDialog(false); }}>
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

      {/* Built-in Countries */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('countries.builtin_countries')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries.builtin_countries.map((country) => (
            <Card key={country.code}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{country.code}</Badge>
                    <span>{country.name.FR}</span>
                  </div>
                  <Badge className={getRegionBadgeClass(country.region)}>
                    {t(`countries.regions.${country.region}`)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>{t('countries.vat_required')}:</strong> {country.vat_id_required ? '✅' : '❌'}</p>
                {country.vat_id_pattern && (
                  <p><strong>{t('countries.vat_pattern')}:</strong> <code className="bg-slate-100 px-1 rounded text-xs">{country.vat_id_pattern}</code></p>
                )}
                <p><strong>{t('countries.mandatory_fields')}:</strong> {country.mandatory_fields?.length || 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Countries */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('countries.custom_countries')}</h3>
        {countries.custom_countries.length === 0 ? (
          <Card className="p-8 text-center">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucun pays personnalisé ajouté</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.custom_countries.map((country) => (
              <Card key={country.code}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{country.code}</Badge>
                      <span>{country.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Badge className={getRegionBadgeClass(country.region)}>
                        {t(`countries.regions.${country.region}`)}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(country)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(country.code)}>
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>{t('countries.vat_required')}:</strong> {country.vat_id_required ? '✅' : '❌'}</p>
                  {country.vat_id_pattern && (
                    <p><strong>{t('countries.vat_pattern')}:</strong> <code className="bg-slate-100 px-1 rounded text-xs">{country.vat_id_pattern}</code></p>
                  )}
                  <p><strong>{t('countries.mandatory_fields')}:</strong> {country.mandatory_fields?.length || 0}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('countries.edit_country')}</DialogTitle>
            <DialogDescription>
              Modifier la règle de pays {editingCountry?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Same form content as add dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_code">{t('countries.country_code')} *</Label>
                <Input
                  id="edit_code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="FR, DE, etc."
                  required
                  maxLength={3}
                  disabled={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_region">{t('countries.region')} *</Label>
                <Select value={formData.region} onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EU">{t('countries.regions.EU')}</SelectItem>
                    <SelectItem value="EEA">{t('countries.regions.EEA')}</SelectItem>
                    <SelectItem value="EXTRA_EU">{t('countries.regions.EXTRA_EU')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">{t('countries.country_name')} *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom en français"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_name_en">{t('countries.country_name_en')}</Label>
                <Input
                  id="edit_name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                  placeholder="Name in English"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_vat_pattern">{t('countries.vat_pattern')}</Label>
              <Input
                id="edit_vat_pattern"
                value={formData.vat_id_pattern}
                onChange={(e) => setFormData(prev => ({ ...prev, vat_id_pattern: e.target.value }))}
                placeholder="FR[0-9A-Z]{2}[0-9]{9}"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_vat_required"
                checked={formData.vat_id_required}
                onChange={(e) => setFormData(prev => ({ ...prev, vat_id_required: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="edit_vat_required">{t('countries.vat_required')}</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => { resetForm(); setShowEditDialog(false); }}>
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

export default CountryManager;
