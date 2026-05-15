"""EInvoicePro mock FastAPI backend matching openapi.json
Minimal but complete implementation for demoing the redesigned frontend.
Storage: MongoDB (uses MONGO_URL + DB_NAME from env).
Auth: JWT bearer (HS256) — register/login/me.
"""
import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Optional, Any, Dict

import bcrypt
import jwt as pyjwt
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me-einvoicepro-dev-secret')
JWT_ALG = 'HS256'
JWT_EXP_HOURS = 24 * 7

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title='EU E-Invoicing Platform - EInvoicePro API', version='1.0.0')
api = APIRouter(prefix='/api/v1')
legacy = APIRouter(prefix='/api')

bearer = HTTPBearer(auto_error=False)
logger = logging.getLogger('einvoicepro')
logging.basicConfig(level=logging.INFO)


# --------------------------- Helpers ---------------------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


def make_token(user_id: str, email: str) -> str:
    payload = {'sub': user_id, 'email': email, 'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS)}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Dict[str, Any]:
    if not creds:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'Not authenticated')
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except pyjwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'Invalid token')
    u = await db.users.find_one({'id': payload['sub']}, {'_id': 0, 'password_hash': 0})
    if not u:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'User not found')
    return u


def clean(doc):
    if doc and '_id' in doc:
        doc.pop('_id')
    return doc


# --------------------------- Models ---------------------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    company_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TaxCategory(BaseModel):
    id: str = 'S'
    percent: float = 20
    tax_scheme: str = 'VAT'


class InvoiceLine(BaseModel):
    line_number: int = 1
    item_name: str = ''
    item_description: Optional[str] = None
    quantity: float = 1
    unit_code: str = 'C62'
    price_amount: float = 0
    line_extension_amount: float = 0
    tax_category: TaxCategory = TaxCategory()
    accounting_cost: Optional[str] = None


class Address(BaseModel):
    street_name: str = ''
    additional_street_name: Optional[str] = None
    city_name: str = ''
    postal_code: str = ''
    country_code: str = 'FR'
    country_subdivision: Optional[str] = None


class Party(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: Optional[str] = None
    name: str = ''
    legal_name: Optional[str] = None
    vat_id: Optional[str] = None
    tax_id: Optional[str] = None
    siret: Optional[str] = None
    peppol_id: Optional[str] = None
    peppol_scheme: Optional[str] = None
    commercial_register_id: Optional[str] = None
    address: Address = Address()
    contact_name: Optional[str] = None
    contact_telephone: Optional[str] = None
    contact_email: Optional[str] = None


class InvoiceCreate(BaseModel):
    model_config = ConfigDict(extra='allow')
    invoice_number: str
    issue_date: str
    due_date: Optional[str] = None
    supplier: Party
    customer: Party
    invoice_lines: List[InvoiceLine] = []
    country_code: str = 'FR'
    format: str = 'UBL_2.1'
    currency_code: str = 'EUR'
    note: Optional[str] = None
    order_reference: Optional[str] = None
    contract_reference: Optional[str] = None
    buyer_reference: Optional[str] = None
    purchase_order_ref: Optional[str] = None
    payment_terms: Optional[str] = None
    recipient_email: Optional[str] = None


class InvoiceUpdate(BaseModel):
    model_config = ConfigDict(extra='allow')


def compute_totals(lines: List[Dict]):
    subtotal = sum((float(l.get('quantity', 0)) * float(l.get('price_amount', 0))) for l in lines)
    tax = sum((float(l.get('quantity', 0)) * float(l.get('price_amount', 0))) * float(l.get('tax_category', {}).get('percent', 0)) / 100 for l in lines)
    return {
        'line_extension_amount': round(subtotal, 2),
        'tax_exclusive_amount': round(subtotal, 2),
        'tax_amount': round(tax, 2),
        'tax_inclusive_amount': round(subtotal + tax, 2),
        'payable_amount': round(subtotal + tax, 2),
    }


# --------------------------- Auth ---------------------------
@api.post('/auth/register')
async def register(body: UserCreate):
    if await db.users.find_one({'email': body.email}):
        raise HTTPException(400, 'Email already registered')
    user_id = str(uuid.uuid4())
    pwd_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    user_doc = {
        'id': user_id, 'email': body.email, 'full_name': body.full_name,
        'company_name': body.company_name, 'role': 'user', 'is_active': True,
        'subscription_plan': 'starter', 'subscription_status': 'active',
        'created_at': now_iso(), 'updated_at': now_iso(), 'password_hash': pwd_hash,
    }
    await db.users.insert_one(user_doc)
    public = {k: v for k, v in user_doc.items() if k not in ('password_hash', '_id')}
    return {'access_token': make_token(user_id, body.email), 'token_type': 'bearer', 'user': public}


@api.post('/auth/login')
async def login(body: UserLogin):
    u = await db.users.find_one({'email': body.email})
    if not u or not bcrypt.checkpw(body.password.encode(), u['password_hash'].encode()):
        raise HTTPException(401, 'Invalid credentials')
    public = {k: v for k, v in u.items() if k not in ('password_hash', '_id')}
    return {'access_token': make_token(u['id'], u['email']), 'token_type': 'bearer', 'user': public}


@api.get('/auth/me')
async def me(user=Depends(current_user)):
    return user


@api.post('/auth/logout')
async def logout(user=Depends(current_user)):
    return {'success': True}


# --------------------------- Health ---------------------------
@api.get('/health/')
async def health():
    return {'status': 'ok', 'time': now_iso()}


@api.get('/health/services')
async def health_services():
    return {'mongo': 'ok', 'storecove': 'mock', 'peppol': 'mock'}


# --------------------------- Invoices ---------------------------
@api.post('/invoices/')
async def create_invoice(body: InvoiceCreate, user=Depends(current_user)):
    inv_id = str(uuid.uuid4())
    lines = [l.model_dump() if hasattr(l, 'model_dump') else l for l in body.invoice_lines]
    for l in lines:
        l['line_extension_amount'] = round(float(l.get('quantity', 0)) * float(l.get('price_amount', 0)), 2)
    totals = compute_totals(lines)
    doc = body.model_dump()
    doc.update({
        'id': inv_id, 'user_id': user['id'], 'invoice_lines': lines,
        'invoice_type_code': '380', 'document_currency_code': body.currency_code,
        'status': 'draft', 'signature_status': 'unsigned', 'sending_status': 'not_sent',
        'payment_status': 'unpaid', 'exchange_rate': 1.0,
        'created_at': now_iso(), 'updated_at': now_iso(),
        'signed_at': None, 'sent_at': None, 'archived_at': None,
        'correction_suggestions': [], 'validation_result': None, 'e_reporting_data': None,
        'tax_currency_code': body.currency_code,
        **totals,
    })
    await db.invoices.insert_one(doc)
    return clean({**doc})


@api.get('/invoices/')
async def list_invoices(user=Depends(current_user)):
    items = await db.invoices.find({'user_id': user['id']}, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return items


@api.get('/invoices/{invoice_id}')
async def get_invoice(invoice_id: str, user=Depends(current_user)):
    inv = await db.invoices.find_one({'id': invoice_id, 'user_id': user['id']}, {'_id': 0})
    if not inv:
        raise HTTPException(404, 'Invoice not found')
    return inv


@api.put('/invoices/{invoice_id}')
async def update_invoice(invoice_id: str, body: dict, user=Depends(current_user)):
    inv = await db.invoices.find_one({'id': invoice_id, 'user_id': user['id']}, {'_id': 0})
    if not inv:
        raise HTTPException(404, 'Invoice not found')
    body.pop('_id', None); body.pop('id', None)
    body['updated_at'] = now_iso()
    if 'invoice_lines' in body and body['invoice_lines']:
        for l in body['invoice_lines']:
            l['line_extension_amount'] = round(float(l.get('quantity', 0)) * float(l.get('price_amount', 0)), 2)
        body.update(compute_totals(body['invoice_lines']))
    await db.invoices.update_one({'id': invoice_id}, {'$set': body})
    return await db.invoices.find_one({'id': invoice_id}, {'_id': 0})


@api.delete('/invoices/{invoice_id}')
async def delete_invoice(invoice_id: str, user=Depends(current_user)):
    r = await db.invoices.delete_one({'id': invoice_id, 'user_id': user['id']})
    if not r.deleted_count:
        raise HTTPException(404, 'Invoice not found')
    return {'success': True}


@api.post('/invoices/{invoice_id}/sign')
async def sign_invoice(invoice_id: str, user=Depends(current_user)):
    inv = await db.invoices.find_one({'id': invoice_id, 'user_id': user['id']})
    if not inv:
        raise HTTPException(404, 'Invoice not found')
    await db.invoices.update_one({'id': invoice_id}, {'$set': {
        'signature_status': 'signed', 'signed_at': now_iso(),
        'signature_hash': uuid.uuid4().hex, 'updated_at': now_iso(),
    }})
    return {'success': True, 'signature_status': 'signed'}


@api.post('/invoices/{invoice_id}/send')
async def send_invoice(invoice_id: str, body: dict = None, user=Depends(current_user)):
    inv = await db.invoices.find_one({'id': invoice_id, 'user_id': user['id']})
    if not inv:
        raise HTTPException(404, 'Invoice not found')
    await db.invoices.update_one({'id': invoice_id}, {'$set': {
        'sending_status': 'sent', 'sent_at': now_iso(), 'status': 'sent',
        'delivery_guid': uuid.uuid4().hex, 'updated_at': now_iso(),
    }})
    return {'success': True, 'message': 'Invoice sent via Peppol (mock)', 'sending_status': 'sent'}


@api.post('/invoices/{invoice_id}/validate')
async def validate_invoice(invoice_id: str, language: str = 'en', user=Depends(current_user)):
    inv = await db.invoices.find_one({'id': invoice_id, 'user_id': user['id']})
    if not inv:
        raise HTTPException(404, 'Invoice not found')
    errors, warnings = [], []
    if not inv.get('invoice_number'):
        errors.append({'rule_id': 'BR-01', 'message': 'Invoice number required', 'field_xpath': '/invoice_number', 'severity': 'error', 'source': 'EN16931'})
    if not (inv.get('supplier') or {}).get('name'):
        errors.append({'rule_id': 'BR-08', 'message': 'Supplier name required', 'field_xpath': '/supplier/name', 'severity': 'error', 'source': 'EN16931'})
    status_val = 'valid' if not errors else 'invalid'
    result = {
        'id': uuid.uuid4().hex, 'invoice_id': invoice_id, 'status': status_val,
        'validation_date': now_iso(), 'errors': errors, 'warnings': warnings,
        'invalid_fields': [e['field_xpath'] for e in errors],
        'country_specific_checks': {'vat_format': True, 'mandatory_fields': not bool(errors)},
        'format_validation': {'schema': True, 'schematron': not bool(errors)},
    }
    new_status = 'validated' if status_val == 'valid' else 'invalid'
    await db.invoices.update_one({'id': invoice_id}, {'$set': {'status': new_status, 'validation_result': result, 'updated_at': now_iso()}})
    return result


@api.post('/invoices/bulk-sign')
async def bulk_sign(ids: List[str], user=Depends(current_user)):
    successful = 0
    for i in ids:
        r = await db.invoices.update_one({'id': i, 'user_id': user['id']}, {'$set': {'signature_status': 'signed', 'signed_at': now_iso()}})
        if r.modified_count: successful += 1
    return {'successful': successful, 'failed': len(ids) - successful, 'total': len(ids)}


@api.post('/invoices/bulk-send')
async def bulk_send(ids: List[str], default_recipient_email: Optional[str] = None, user=Depends(current_user)):
    results = []
    for i in ids:
        r = await db.invoices.update_one({'id': i, 'user_id': user['id']}, {'$set': {'sending_status': 'sent', 'sent_at': now_iso(), 'status': 'sent'}})
        results.append({'id': i, 'success': bool(r.modified_count)})
    return {'successful': sum(1 for r in results if r['success']), 'failed': sum(1 for r in results if not r['success']), 'results': results}


@api.get('/invoices/{invoice_id}/export/{export_format}')
async def export_invoice(invoice_id: str, export_format: str, user=Depends(current_user)):
    inv = await db.invoices.find_one({'id': invoice_id, 'user_id': user['id']}, {'_id': 0})
    if not inv:
        raise HTTPException(404, 'Invoice not found')
    fmt = export_format.lower()
    if fmt in ('ubl', 'cii', 'facturx-xml', 'factur-x-xml'):
        xml = f"""<?xml version='1.0' encoding='UTF-8'?>
<Invoice xmlns='urn:oasis:names:specification:ubl:schema:xsd:Invoice-2'>
  <ID>{inv['invoice_number']}</ID>
  <IssueDate>{inv.get('issue_date','')}</IssueDate>
  <DocumentCurrencyCode>{inv.get('currency_code','EUR')}</DocumentCurrencyCode>
  <AccountingSupplierParty><Party><PartyName><Name>{(inv.get('supplier') or {}).get('name','')}</Name></PartyName></Party></AccountingSupplierParty>
  <AccountingCustomerParty><Party><PartyName><Name>{(inv.get('customer') or {}).get('name','')}</Name></PartyName></Party></AccountingCustomerParty>
  <LegalMonetaryTotal><PayableAmount currencyID='{inv.get('currency_code','EUR')}'>{inv.get('payable_amount',0)}</PayableAmount></LegalMonetaryTotal>
</Invoice>"""
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(xml, media_type='application/xml')
    return inv


@api.get('/invoices/{invoice_id}/history')
async def invoice_history(invoice_id: str, user=Depends(current_user)):
    inv = await db.invoices.find_one({'id': invoice_id, 'user_id': user['id']}, {'_id': 0})
    if not inv:
        raise HTTPException(404, 'Invoice not found')
    events = []
    events.append({'action': 'Created', 'created_at': inv.get('created_at')})
    if inv.get('signed_at'): events.append({'action': 'Signed', 'created_at': inv['signed_at']})
    if inv.get('sent_at'): events.append({'action': 'Sent via Peppol', 'created_at': inv['sent_at']})
    if inv.get('archived_at'): events.append({'action': 'Archived', 'created_at': inv['archived_at']})
    return events


# --------------------------- Countries ---------------------------
COUNTRIES = {
    'FR': {'code': 'FR', 'name': 'France', 'name_en': 'France', 'region': 'EU', 'vat_id_required': True, 'vat_id_pattern': r'^FR\d{11}$', 'date_format': 'DD/MM/YYYY', 'mandatory_fields': ['siret', 'vat_id', 'peppol_id'], 'is_active': True, 'created_at': now_iso()},
    'DE': {'code': 'DE', 'name': 'Germany', 'name_en': 'Germany', 'region': 'EU', 'vat_id_required': True, 'vat_id_pattern': r'^DE\d{9}$', 'date_format': 'DD.MM.YYYY', 'mandatory_fields': ['vat_id'], 'is_active': True, 'created_at': now_iso()},
    'IT': {'code': 'IT', 'name': 'Italy', 'name_en': 'Italy', 'region': 'EU', 'vat_id_required': True, 'vat_id_pattern': r'^IT\d{11}$', 'date_format': 'DD/MM/YYYY', 'mandatory_fields': ['vat_id', 'tax_id'], 'is_active': True, 'created_at': now_iso()},
    'ES': {'code': 'ES', 'name': 'Spain', 'name_en': 'Spain', 'region': 'EU', 'vat_id_required': True, 'date_format': 'DD/MM/YYYY', 'mandatory_fields': ['vat_id'], 'is_active': True, 'created_at': now_iso()},
    'NL': {'code': 'NL', 'name': 'Netherlands', 'name_en': 'Netherlands', 'region': 'EU', 'vat_id_required': True, 'date_format': 'DD-MM-YYYY', 'mandatory_fields': ['vat_id'], 'is_active': True, 'created_at': now_iso()},
    'BE': {'code': 'BE', 'name': 'Belgium', 'name_en': 'Belgium', 'region': 'EU', 'vat_id_required': True, 'date_format': 'DD/MM/YYYY', 'mandatory_fields': ['vat_id'], 'is_active': True, 'created_at': now_iso()},
    'LU': {'code': 'LU', 'name': 'Luxembourg', 'name_en': 'Luxembourg', 'region': 'EU', 'vat_id_required': True, 'date_format': 'DD/MM/YYYY', 'mandatory_fields': ['vat_id', 'peppol_id'], 'is_active': True, 'created_at': now_iso()},
    'AT': {'code': 'AT', 'name': 'Austria', 'name_en': 'Austria', 'region': 'EU', 'vat_id_required': True, 'date_format': 'DD.MM.YYYY', 'mandatory_fields': ['vat_id'], 'is_active': True, 'created_at': now_iso()},
    'PT': {'code': 'PT', 'name': 'Portugal', 'name_en': 'Portugal', 'region': 'EU', 'vat_id_required': True, 'date_format': 'DD-MM-YYYY', 'mandatory_fields': ['vat_id'], 'is_active': True, 'created_at': now_iso()},
}


@api.get('/countries/')
async def list_countries():
    return COUNTRIES


@api.get('/countries/{country_code}/rules')
async def country_rules(country_code: str):
    return COUNTRIES.get(country_code.upper(), {})


@api.get('/countries/required-fields')
async def required_fields(supplier_country: Optional[str] = None, customer_country: Optional[str] = None):
    fields = set()
    info = {}
    for code in [supplier_country, customer_country]:
        if code and code.upper() in COUNTRIES:
            c = COUNTRIES[code.upper()]
            fields.update(c.get('mandatory_fields', []))
            info[code.upper()] = c
    return {'required_fields': list(fields), 'countries_info': info}


# --------------------------- Currencies ---------------------------
DEFAULT_CURRENCIES = [
    {'code': 'EUR', 'name': 'Euro', 'symbol': '€', 'exchange_rate': 1.0, 'is_base_currency': True, 'is_active': True},
    {'code': 'USD', 'name': 'US Dollar', 'symbol': '$', 'exchange_rate': 1.08, 'is_base_currency': False, 'is_active': True},
    {'code': 'GBP', 'name': 'British Pound', 'symbol': '£', 'exchange_rate': 0.86, 'is_base_currency': False, 'is_active': True},
    {'code': 'CHF', 'name': 'Swiss Franc', 'symbol': 'CHF', 'exchange_rate': 0.95, 'is_base_currency': False, 'is_active': True},
]


async def seed_currencies():
    if not await db.currencies.count_documents({}):
        for c in DEFAULT_CURRENCIES:
            c2 = dict(c)
            c2.update({'id': str(uuid.uuid4()), 'last_updated': now_iso(), 'created_at': now_iso(), 'updated_at': now_iso()})
            await db.currencies.insert_one(c2)


@api.get('/currencies/')
async def list_currencies(user=Depends(current_user)):
    await seed_currencies()
    return await db.currencies.find({}, {'_id': 0}).to_list(100)


@api.post('/currencies/')
async def create_currency(body: dict, user=Depends(current_user)):
    code = body.get('code', '').upper()
    if not code:
        raise HTTPException(400, 'Code required')
    if await db.currencies.find_one({'code': code}):
        raise HTTPException(400, 'Currency exists')
    doc = {'id': str(uuid.uuid4()), 'code': code, 'name': body.get('name', code), 'symbol': body.get('symbol', code), 'exchange_rate': 1.0, 'is_base_currency': False, 'is_active': True, 'last_updated': now_iso(), 'created_at': now_iso(), 'updated_at': now_iso()}
    await db.currencies.insert_one(doc)
    return clean(doc)


@api.put('/currencies/{currency_id}')
async def update_currency(currency_id: str, body: dict, user=Depends(current_user)):
    body['updated_at'] = now_iso()
    await db.currencies.update_one({'id': currency_id}, {'$set': {k: v for k, v in body.items() if v is not None}})
    return await db.currencies.find_one({'id': currency_id}, {'_id': 0})


@api.delete('/currencies/{currency_id}')
async def delete_currency(currency_id: str, user=Depends(current_user)):
    await db.currencies.delete_one({'id': currency_id})
    return {'success': True}


@api.post('/currencies/refresh-rates')
async def refresh_rates(user=Depends(current_user)):
    return {'success': True, 'updated': await db.currencies.count_documents({})}


# --------------------------- API Keys ---------------------------
@api.get('/api-keys')
async def list_api_keys(user=Depends(current_user)):
    return await db.api_keys.find({'user_id': user['id']}, {'_id': 0, 'secret': 0}).to_list(100)


@api.post('/api-keys')
async def create_api_key(body: dict, user=Depends(current_user)):
    kid = str(uuid.uuid4())
    secret = 'einv_test_' + uuid.uuid4().hex
    doc = {
        'id': kid, 'user_id': user['id'], 'name': body.get('name', 'API key'),
        'key_prefix': secret[:12], 'scoped_entity_ids': body.get('scoped_entity_ids', []),
        'rate_limit': body.get('rate_limit', 60), 'secret': secret,
        'created_at': now_iso(), 'last_used_at': None, 'revoked_at': None,
    }
    await db.api_keys.insert_one(doc)
    public = {k: v for k, v in doc.items() if k != 'secret' and k != '_id'}
    public['key'] = secret
    return public


@api.delete('/api-keys/{api_key_id}')
async def revoke_api_key(api_key_id: str, user=Depends(current_user)):
    await db.api_keys.delete_one({'id': api_key_id, 'user_id': user['id']})
    return {'success': True}


# --------------------------- Billing ---------------------------
@api.get('/billing/usage')
async def billing_usage(user=Depends(current_user)):
    invoices_used = await db.invoices.count_documents({'user_id': user['id']})
    limits = {'starter': 10, 'pro': 500, 'enterprise': 10000}
    plan = user.get('subscription_plan', 'starter')
    return {'plan': plan, 'invoices_used': invoices_used, 'invoices_limit': limits.get(plan, 10), 'period_start': now_iso(), 'period_end': now_iso()}


@api.post('/billing/checkout')
async def billing_checkout(plan: str = 'pro', user=Depends(current_user)):
    return {'checkout_url': f'https://billing.example.com/checkout?plan={plan}&user={user["id"]}'}


@api.post('/billing/portal')
async def billing_portal(user=Depends(current_user)):
    return {'portal_url': 'https://billing.example.com/portal'}


# --------------------------- Integrations ---------------------------
SUPPORTED_SYSTEMS = [
    {'code': 'sage', 'name': 'Sage'}, {'code': 'quickbooks', 'name': 'QuickBooks'},
    {'code': 'xero', 'name': 'Xero'}, {'code': 'odoo', 'name': 'Odoo'},
    {'code': 'sap', 'name': 'SAP'}, {'code': 'cegid', 'name': 'Cegid'},
]


@api.get('/integrations/accounting/systems')
async def supported_systems(user=Depends(current_user)):
    return {'supported_systems': SUPPORTED_SYSTEMS}


@api.get('/integrations/configs')
async def integration_configs(user=Depends(current_user)):
    return await db.integrations.find({'user_id': user['id']}, {'_id': 0}).to_list(100)


@api.post('/integrations/configs')
async def create_integration_config(body: dict, user=Depends(current_user)):
    doc = {'id': str(uuid.uuid4()), 'user_id': user['id'], 'system_code': body.get('system_code', ''), 'system_name': body.get('system_code', '').title(), 'config': body.get('config', {}), 'credentials': body.get('credentials', {}), 'is_active': True, 'last_sync': None, 'created_at': now_iso(), 'updated_at': now_iso()}
    await db.integrations.insert_one(doc)
    return clean(doc)


# --------------------------- Compliance ---------------------------
@api.get('/compliance/report')
async def compliance_report(user=Depends(current_user)):
    total = await db.invoices.count_documents({'user_id': user['id']})
    valid = await db.invoices.count_documents({'user_id': user['id'], 'status': {'$in': ['validated', 'submitted', 'delivered', 'paid']}})
    return {'id': uuid.uuid4().hex, 'company_id': user['id'], 'period_start': now_iso(), 'period_end': now_iso(), 'total_invoices': total, 'valid_invoices': valid, 'invalid_invoices': total - valid, 'compliance_rate': (valid / total * 100) if total else 100, 'country_breakdown': {}, 'generated_at': now_iso()}


# --------------------------- App wiring ---------------------------
@legacy.get('/')
async def legacy_root():
    return {'message': 'EInvoicePro API. Use /api/v1/* endpoints.'}


app.include_router(api)
app.include_router(legacy)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('shutdown')
async def shutdown():
    client.close()
