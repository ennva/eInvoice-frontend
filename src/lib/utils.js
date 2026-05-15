import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const INVOICE_STATUSES = ['draft', 'validated', 'invalid', 'submitted', 'delivered', 'rejected', 'paid', 'archived', 'sent', 'received'];

export const COUNTRY_OPTIONS = [
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'PT', name: 'Portugal' },
];

export const INVOICE_FORMATS = [
  'UBL_2.1', 'CII_D16B', 'FACTUR-X_MINIMUM', 'FACTUR-X_BASIC',
  'FACTUR-X_BASIC-WL', 'FACTUR-X_EN16931', 'FACTUR-X_EXTENDED',
];

export const PEPPOL_SCHEMES = [
  { value: '0009', label: 'FR:SIRET (0009)' },
  { value: '9952', label: 'LU:VAT (9952)' },
  { value: '9938', label: 'LU:VAT (9938)' },
  { value: '0190', label: 'NL:KVK (0190)' },
  { value: '0208', label: 'BE:VAT (0208)' },
  { value: '9930', label: 'DE:VAT (9930)' },
  { value: '0088', label: 'GLN (0088)' },
  { value: '0002', label: 'Email (0002)' },
];
