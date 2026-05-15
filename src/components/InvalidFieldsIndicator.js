import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, Edit3 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const InvalidFieldsIndicator = ({ validationResult, onFixFields }) => {
  const { t } = useTranslation();

  if (!validationResult || validationResult.status === 'valid' || !validationResult.invalid_fields?.length) {
    return null;
  }

  const getFieldDisplayName = (fieldPath) => {
    const fieldMappings = {
      'invoice_number': t('invoices.invoice_number'),
      'supplier.name': t('invoices.supplier') + ' - ' + t('invoices.name'),
      'customer.name': t('invoices.customer') + ' - ' + t('invoices.name'),
      'supplier.vat_id': t('invoices.supplier') + ' - ' + t('invoices.vat_id'),
      'customer.vat_id': t('invoices.customer') + ' - ' + t('invoices.vat_id'),
      'supplier.tax_id': t('invoices.supplier') + ' - ' + t('invoices.tax_id'),
      'customer.tax_id': t('invoices.customer') + ' - ' + t('invoices.tax_id'),
      'supplier.address.street_name': t('invoices.supplier') + ' - ' + t('invoices.street'),
      'supplier.address.city_name': t('invoices.supplier') + ' - ' + t('invoices.city'),
      'supplier.address.postal_code': t('invoices.supplier') + ' - ' + t('invoices.postal_code'),
      'customer.address.street_name': t('invoices.customer') + ' - ' + t('invoices.street'),
      'customer.address.city_name': t('invoices.customer') + ' - ' + t('invoices.city'),
      'customer.address.postal_code': t('invoices.customer') + ' - ' + t('invoices.postal_code'),
      'due_date': t('invoices.due_date'),
      'payment_terms': t('invoices.payment_terms'),
      'recipient_email': t('invoices.recipient_email'),
      'item_name': t('invoices.item_name'),
      'quantity': t('invoices.quantity'),
      'price_amount': t('invoices.unit_price'),
      'line_extension_amount': t('invoices.line_total'),
      'tax_category.percent': t('invoices.tax_rate'),
      'tax_amount': 'Montant TVA',
    };

    // Handle dynamic invoice line fields
    if (fieldPath.includes('invoice_lines[')) {
      const match = fieldPath.match(/invoice_lines\[(\d+)\]\.(.+)/);
      if (match) {
        const lineIndex = parseInt(match[1]) + 1;
        const field = match[2];
        const fieldName = fieldMappings[field] || field;
        return `${t('invoices.invoice_lines')} ${lineIndex} - ${fieldName}`;
      }
    }

    return fieldMappings[fieldPath] || fieldPath;
  };

  return (
    <Alert className="border-red-200 bg-red-50 mb-4">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="min-w-0">
        <div className="space-y-3">
          <p className="font-medium text-red-800">
            {t('invoices.invalid_fields_detected')}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {validationResult.invalid_fields.map((field, index) => (
              <Badge 
                key={index} 
                variant="destructive" 
                className="bg-red-100 text-red-800 border-red-300"
              >
                {getFieldDisplayName(field)}
              </Badge>
            ))}
          </div>
          
          {onFixFields && (
            <Button
              size="sm"
              onClick={onFixFields}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {t('invoices.fix_invalid_fields')}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default InvalidFieldsIndicator;
