          {/* Factures */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">{t('invoices.title')}</h2>
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

            <div className="grid gap-4">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold">{invoice.invoice_number}</h3>
                          {getStatusBadge(invoice.status)}
                          <Badge variant="outline" className="text-xs">
                            {invoice.country_code}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          <Building2 className="w-4 h-4 inline mr-1" />
                          {invoice.supplier.name} → {invoice.customer.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {t('invoices.issued_on')} {new Date(invoice.issue_date).toLocaleDateString()}
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {invoice.payable_amount?.toFixed(2) || '0.00'} {invoice.document_currency_code}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => validateInvoice(invoice.id)}
                          disabled={loading}
                          data-testid={`validate-invoice-${invoice.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {t('common.validate')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportInvoice(invoice.id, 'ubl')}
                          data-testid={`export-invoice-${invoice.id}`}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          XML
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewInvoice(invoice)}
                          data-testid={`view-invoice-${invoice.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {t('common.view')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editInvoice(invoice)}
                          data-testid={`edit-invoice-${invoice.id}`}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          {t('common.edit')}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Ajout de l'indicateur de champs invalides pour chaque facture */}
                    {invoice.status === 'invalid' && validationResult?.invoice_id === invoice.id && (
                      <div className="mt-4">
                        <InvalidFieldsIndicator 
                          validationResult={validationResult}
                          onFixFields={() => editInvoice(invoice)}
                        />
                      </div>
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

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="DE">Allemagne</SelectItem>
                    <SelectItem value="IT">Italie</SelectItem>
                    <SelectItem value="ES">Espagne</SelectItem>
                    <SelectItem value="NL">Pays-Bas</SelectItem>
                    <SelectItem value="LU">Luxembourg</SelectItem>
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
                    <SelectItem value="UBL_2.1">UBL 2.1</SelectItem>
                    <SelectItem value="CII_D16B">UN/CEFACT CII</SelectItem>
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
                  <Label>{t('invoices.vat_id')}</Label>
                  <Input
                    value={invoiceForm.supplier.vat_id}
                    onChange={(e) => setInvoiceForm(prev => ({ 
                      ...prev, 
                      supplier: { ...prev.supplier, vat_id: e.target.value } 
                    }))}
                    placeholder="FR12345678901"
                  />
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
                  <Label>{t('invoices.vat_id')}</Label>
                  <Input
                    value={invoiceForm.customer.vat_id}
                    onChange={(e) => setInvoiceForm(prev => ({ 
                      ...prev, 
                      customer: { ...prev.customer, vat_id: e.target.value } 
                    }))}
                    placeholder="FR98765432109"
                  />
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
        <DialogContent className="max-w-2xl">
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
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="flex justify-end space-x-2">
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

// App principal avec routing
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<LandingPage />} />
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
      </AuthProvider>
    </div>
  );
}

export default App;