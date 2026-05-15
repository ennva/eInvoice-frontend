"""Backend smoke + integration tests for EInvoicePro mock API."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://invoice-saas-22.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api/v1"


@pytest.fixture(scope='session')
def session():
    s = requests.Session()
    s.headers.update({'Content-Type': 'application/json'})
    return s


@pytest.fixture(scope='session')
def auth(session):
    # Register a fresh user, fall back to login if exists
    email = f"test+saas_{uuid.uuid4().hex[:8]}@example.com"
    pwd = 'Test1234!'
    r = session.post(f"{API}/auth/register", json={
        'email': email, 'password': pwd, 'full_name': 'Pytest User', 'company_name': 'Pytest Co'
    })
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    assert 'access_token' in data and 'user' in data
    assert data['user']['email'] == email
    return {'token': data['access_token'], 'email': email, 'password': pwd, 'user_id': data['user']['id']}


@pytest.fixture()
def client(session, auth):
    session.headers.update({'Authorization': f"Bearer {auth['token']}"})
    return session


# ----- Health -----
class TestHealth:
    def test_health(self, session):
        r = session.get(f"{API}/health/")
        assert r.status_code == 200
        assert r.json().get('status') == 'ok'


# ----- Auth -----
class TestAuth:
    def test_login_existing_demo(self, session):
        r = session.post(f"{API}/auth/login", json={'email': 'demo@example.com', 'password': 'Demo1234!'})
        # demo user may or may not be pre-seeded; accept 200 or 401
        assert r.status_code in (200, 401)

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login", json={'email': 'nope@example.com', 'password': 'wrong'})
        assert r.status_code == 401

    def test_me(self, client, auth):
        r = client.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()['email'] == auth['email']


# ----- Countries / Currencies -----
class TestStaticData:
    def test_countries(self, session):
        r = session.get(f"{API}/countries/")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict)
        assert 'FR' in data and 'DE' in data
        assert len(data) >= 9

    def test_currencies(self, client):
        r = client.get(f"{API}/currencies/")
        assert r.status_code == 200
        codes = {c['code'] for c in r.json()}
        for c in ('EUR', 'USD', 'GBP', 'CHF'):
            assert c in codes

    def test_create_currency(self, client):
        code = f"X{uuid.uuid4().hex[:2].upper()}"
        r = client.post(f"{API}/currencies/", json={'code': code, 'name': 'Test ' + code, 'symbol': code})
        assert r.status_code == 200
        assert r.json()['code'] == code


# ----- Invoices CRUD + actions -----
class TestInvoices:
    @pytest.fixture()
    def invoice_id(self, client):
        payload = {
            'invoice_number': f"TEST-{uuid.uuid4().hex[:6]}",
            'issue_date': '2026-01-15',
            'supplier': {'name': 'Pytest Supplier', 'address': {'country_code': 'FR'}},
            'customer': {'name': 'Pytest Customer', 'address': {'country_code': 'DE'}},
            'invoice_lines': [{
                'line_number': 1, 'item_name': 'Widget', 'quantity': 2, 'price_amount': 50,
                'tax_category': {'id': 'S', 'percent': 20, 'tax_scheme': 'VAT'}
            }],
            'country_code': 'FR', 'currency_code': 'EUR',
        }
        r = client.post(f"{API}/invoices/", json=payload)
        assert r.status_code == 200, r.text
        inv = r.json()
        assert inv['payable_amount'] == 120.0  # 2*50 + 20% tax
        return inv['id']

    def test_get_invoice(self, client, invoice_id):
        r = client.get(f"{API}/invoices/{invoice_id}")
        assert r.status_code == 200
        assert r.json()['id'] == invoice_id

    def test_list_invoices(self, client, invoice_id):
        r = client.get(f"{API}/invoices/")
        assert r.status_code == 200
        ids = [i['id'] for i in r.json()]
        assert invoice_id in ids

    def test_sign(self, client, invoice_id):
        r = client.post(f"{API}/invoices/{invoice_id}/sign")
        assert r.status_code == 200
        assert r.json()['signature_status'] == 'signed'
        g = client.get(f"{API}/invoices/{invoice_id}").json()
        assert g['signature_status'] == 'signed'

    def test_send(self, client, invoice_id):
        r = client.post(f"{API}/invoices/{invoice_id}/send", json={})
        assert r.status_code == 200
        assert r.json()['sending_status'] == 'sent'

    def test_validate(self, client, invoice_id):
        r = client.post(f"{API}/invoices/{invoice_id}/validate")
        assert r.status_code == 200
        assert r.json()['status'] in ('valid', 'invalid')

    def test_export_ubl(self, client, invoice_id):
        r = client.get(f"{API}/invoices/{invoice_id}/export/ubl")
        assert r.status_code == 200
        assert '<Invoice' in r.text


# ----- API Keys -----
class TestApiKeys:
    def test_create_and_revoke(self, client):
        r = client.post(f"{API}/api-keys", json={'name': 'TEST_key'})
        assert r.status_code == 200
        d = r.json()
        assert d['key'].startswith('einv_test_')
        kid = d['id']
        r2 = client.get(f"{API}/api-keys")
        assert r2.status_code == 200
        assert any(k['id'] == kid for k in r2.json())
        r3 = client.delete(f"{API}/api-keys/{kid}")
        assert r3.status_code == 200


# ----- Billing -----
class TestBilling:
    def test_usage(self, client):
        r = client.get(f"{API}/billing/usage")
        assert r.status_code == 200
        assert 'invoices_limit' in r.json()


# ----- Integrations -----
class TestIntegrations:
    def test_supported_systems(self, client):
        r = client.get(f"{API}/integrations/accounting/systems")
        assert r.status_code == 200
        assert len(r.json()['supported_systems']) >= 4
