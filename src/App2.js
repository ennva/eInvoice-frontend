// Continuation of App.js

// Composant Dashboard mis à jour avec i18n et nouvelles fonctionnalités
const EInvoicePro = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  // États pour les données
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countryRules, setCountryRules] = useState({});
  const [supportedSystems, setSupportedSystems] = useState([]);

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
    note: '',
    order_reference: '',
    supplier: {
      name: '',
      vat_id: '',
      tax_id: '',
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

  // Chargement initial
  useEffect(() => {
    loadInvoices();
    loadCountryRules();
    loadSupportedSystems();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/invoices`);
      setInvoices(response.data);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
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

  const createInvoice = async () => {
    try {
      setLoading(true);
      
      const calculatedForm = { ...invoiceForm };
      calculatedForm.invoice_lines = calculatedForm.invoice_lines.map(line => ({
        ...line,
        line_extension_amount: line.quantity * line.price_amount
      }));

      const response = await axios.post(`${API}/invoices`, calculatedForm);
      toast.success(t('invoices.created_success'));
      setShowCreateDialog(false);
      loadInvoices();
      
      setInvoiceForm({
        ...invoiceForm,
        invoice_number: '',
        note: '',
        order_reference: '',
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
      const response = await axios.post(`${API}/invoices/${invoiceId}/validate`);
      setValidationResult(response.data);
      
      if (response.data.status === 'valid') {
        toast.success(t('invoices.validation_success'));
      } else {
        toast.warning(t('invoices.validation_warning'));
      }
      
      loadInvoices();
    } catch (error) {
      console.error('Erreur validation facture:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (invoiceId, updateData) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API}/invoices/${invoiceId}`, updateData);
      toast.success(t('invoices.updated_success'));
      setShowEditDialog(false);
      setEditingInvoice(null);
      loadInvoices();
      return response.data;
    } catch (error) {
      console.error('Erreur mise à jour facture:', error);
      toast.error(t('common.error'));
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

  const exportInvoice = async (invoiceId, format) => {
    try {
      const response = await axios.get(`${API}/invoices/${invoiceId}/export/${format}`, {
        responseType: format === 'ubl' ? 'text' : 'json'
      });
      
      if (format === 'ubl') {
        const blob = new Blob([response.data], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${invoiceId}.xml`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      toast.success(t('invoices.export_success', { format: format.toUpperCase() }));
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error(t('common.error'));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      valid: { variant: "default", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
      invalid: { variant: "destructive", className: "bg-red-100 text-red-800", icon: XCircle },
      draft: { variant: "secondary", className: "bg-slate-100 text-slate-600", icon: FileText },
      sent: { variant: "outline", className: "bg-blue-100 text-blue-800", icon: Upload }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {status}
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
            
            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
              
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span>{user?.full_name}</span>
              </div>
              
              <Badge className="bg-emerald-100 text-emerald-800">
                <Globe className="w-3 h-3 mr-1" />
                {t('landing.badges.en16931')}
              </Badge>
              
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="create-invoice-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('invoices.new_invoice')}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={logout}
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('auth.logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-96">
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
                      ? Math.round((invoices.filter(inv => inv.status === 'valid').length / invoices.length) * 100)
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
                  editInvoice(invoiceToEdit);
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
          </TabsContent>