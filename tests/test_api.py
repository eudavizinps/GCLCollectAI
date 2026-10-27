"""HTTP tests for security boundaries and the main financial workflow."""
from datetime import date, timedelta
from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend" / ".deps"))
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from app import main
from app.core import storage
from scripts.seed_demo import build


@pytest.fixture
def db_client(tmp_path, monkeypatch):
    path = tmp_path / "store.json"
    monkeypatch.setattr(storage, "DATA_PATH", path)
    monkeypatch.setattr(main, "DATA_PATH", path)
    initial = build()
    storage.change(lambda db: (db.clear(), db.update(initial)))
    with TestClient(main.app) as client:
        yield client, initial, path


def login(client, email="admin1@demo.collectai.local"):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "Demo@12345"})
    assert response.status_code == 200, response.text
    return response.json()


def test_login_and_tenant_isolation(db_client):
    client, initial, _ = db_client
    assert client.get("/api/v1/customers").status_code == 401
    assert client.post("/api/v1/auth/login", json={"email": "admin1@demo.collectai.local", "password": "wrong"}).status_code == 401
    user = login(client)
    own = client.get("/api/v1/customers?size=100").json()["items"]
    assert len(own) == 30
    other = next(c for c in initial["records"]["customers"] if c["tenant_id"] != user["tenant_id"])
    assert client.get(f"/api/v1/customers/{other['id']}").status_code == 404
    assert client.post("/api/v1/occurrences", json={"data": {"customer_id": other["id"], "type": "ligacao", "description": "Teste"}}).status_code == 404


def test_crud_persists_and_permissions(db_client):
    client, _, path = db_client
    login(client, "operator1@demo.collectai.local")
    response = client.post("/api/v1/customers", json={"data": {"name": "Cliente Fictício", "document": "12345678901"}})
    assert response.status_code == 200, response.text
    item_id = response.json()["id"]
    assert client.get(f"/api/v1/customers/{item_id}").status_code == 200
    assert client.get("/api/v1/audit").status_code == 403
    assert client.post("/api/v1/users", json={"name": "Teste", "email": "t@demo.local", "role": "admin", "password": "Demo@12345"}).status_code == 403
    assert item_id in path.read_text(encoding="utf-8")
    with TestClient(main.app) as reopened:
        assert reopened.get(f"/api/v1/customers/{item_id}").status_code == 401
        login(reopened)
        assert reopened.get(f"/api/v1/customers/{item_id}").status_code == 200


def test_negotiation_payment_and_idempotency(db_client):
    client, initial, _ = db_client
    user = login(client)
    title = next(t for t in initial["records"]["receivables"] if t["tenant_id"] == user["tenant_id"] and float(t["balance"]) >= 1000)
    payload = {"customer_id": title["customer_id"], "receivable_ids": [title["id"]], "discount_pct": "10", "down_payment": "0", "installments": 3, "first_due": (date.today()+timedelta(days=7)).isoformat()}
    invalid = client.post("/api/v1/negotiations/simulate", json={**payload, "discount_pct": "40"})
    assert invalid.status_code == 422
    preview = client.post("/api/v1/negotiations/simulate", json=payload)
    assert preview.status_code == 200, preview.text
    proposal = client.post("/api/v1/negotiations", json=payload)
    assert proposal.status_code == 200, proposal.text
    negotiation_id = proposal.json()["id"]
    assert client.post("/api/v1/negotiations", json=payload).status_code == 409
    agreement = client.post(f"/api/v1/negotiations/{negotiation_id}/accept")
    assert agreement.status_code == 200, agreement.text
    agreement_id = agreement.json()["id"]
    discounted_balance = float(client.get(f"/api/v1/receivables/{title['id']}").json()["balance"])
    assert discounted_balance == float(agreement.json()["total"])
    before = client.get("/api/v1/dashboard/overview").json()["recovered"]
    payment = client.post("/api/v1/payments", json={"agreement_id": agreement_id, "amount": "50.00", "method": "pix"})
    assert payment.status_code == 200, payment.text
    payment_id = payment.json()["id"]
    assert client.post(f"/api/v1/payments/{payment_id}/confirm").status_code == 200
    assert client.post(f"/api/v1/payments/{payment_id}/confirm").status_code == 200
    after = client.get("/api/v1/dashboard/overview").json()["recovered"]
    assert float(after) - float(before) == 50
    assert float(client.get(f"/api/v1/agreements/{agreement_id}").json()["balance"]) == float(agreement.json()["balance"]) - 50
    assert float(client.get(f"/api/v1/receivables/{title['id']}").json()["balance"]) == discounted_balance - 50
    assert client.post(f"/api/v1/payments/{payment_id}/reverse").status_code == 200
    assert client.get("/api/v1/dashboard/overview").json()["recovered"] == before
    assert float(client.get(f"/api/v1/receivables/{title['id']}").json()["balance"]) == discounted_balance


def test_approval_and_demo_ai(db_client):
    client, initial, _ = db_client
    user = login(client, "operator1@demo.collectai.local")
    title = next(t for t in initial["records"]["receivables"] if t["tenant_id"] == user["tenant_id"] and float(t["balance"]) >= 1000)
    payload = {"customer_id": title["customer_id"], "receivable_ids": [title["id"]], "discount_pct": "25", "down_payment": "0", "installments": 3, "first_due": (date.today()+timedelta(days=7)).isoformat()}
    negotiation = client.post("/api/v1/negotiations", json=payload).json()
    assert negotiation["status"] == "pending_approval"
    assert client.post(f"/api/v1/negotiations/{negotiation['id']}/approve").status_code == 403
    assert client.post(f"/api/v1/negotiations/{negotiation['id']}/accept").status_code == 409
    analysis = client.post("/api/v1/ai/analyze-customer", json={"customer_id": title["customer_id"]})
    assert analysis.status_code == 200, analysis.text
    assert analysis.json()["mode"] == "demo"
    login(client)
    assert client.post(f"/api/v1/negotiations/{negotiation['id']}/approve").status_code == 200
    assert client.post(f"/api/v1/negotiations/{negotiation['id']}/accept").status_code == 200


def test_user_management_and_notification_preference(db_client):
    client, initial, _ = db_client
    admin = login(client)
    user = client.post("/api/v1/users", json={"name": "Analista Teste", "email": "analista@demo.local", "role": "analyst", "password": "Senha@12345"})
    assert user.status_code == 200, user.text
    user_id = user.json()["id"]
    assert client.patch(f"/api/v1/users/{user_id}", json={"role": "operator"}).json()["role"] == "operator"
    assert client.post(f"/api/v1/users/{user_id}/toggle").json()["active"] is False
    assert client.patch(f"/api/v1/users/{admin['id']}", json={"role": "operator"}).status_code == 409
    assert client.patch("/api/v1/settings", json={"notifications": False}).status_code == 200
    title = next(t for t in initial["records"]["receivables"] if t["tenant_id"] == admin["tenant_id"] and float(t["balance"]) >= 1000)
    payload = {"customer_id": title["customer_id"], "receivable_ids": [title["id"]], "discount_pct": "25", "down_payment": "0", "installments": 3, "first_due": (date.today()+timedelta(days=7)).isoformat()}
    before = client.get("/api/v1/notifications").json()["total"]
    assert client.post("/api/v1/negotiations", json=payload).status_code == 200
    assert client.get("/api/v1/notifications").json()["total"] == before


def test_seeded_payment_reversal_updates_installment(db_client):
    client, initial, _ = db_client
    admin = login(client)
    payment = next(p for p in initial["records"]["payments"] if p["tenant_id"] == admin["tenant_id"] and p["status"] == "confirmed")
    agreement_before = client.get(f"/api/v1/agreements/{payment['agreement_id']}").json()
    before_installment = float(agreement_before["schedule"][0]["paid"])
    response = client.post(f"/api/v1/payments/{payment['id']}/reverse")
    assert response.status_code == 200, response.text
    agreement_after = client.get(f"/api/v1/agreements/{payment['agreement_id']}").json()
    assert float(agreement_after["schedule"][0]["paid"]) == before_installment - float(payment["amount"])


def test_registration_chain_and_occurrence(db_client):
    client, initial, _ = db_client
    admin = login(client)
    foreign_creditor = next(c for c in initial["records"]["creditors"] if c["tenant_id"] != admin["tenant_id"])
    assert client.post("/api/v1/portfolios", json={"data": {"name": "Invasão", "creditor_id": foreign_creditor["id"]}}).status_code == 404
    creditor = client.post("/api/v1/creditors", json={"data": {"name": "Credor Fictício"}}).json()
    portfolio = client.post("/api/v1/portfolios", json={"data": {"name": "Carteira Nova", "creditor_id": creditor["id"]}}).json()
    customer = client.post("/api/v1/customers", json={"data": {"name": "Maria Exemplo", "document": "98765432100", "portfolio_id": portfolio["id"]}}).json()
    contract = client.post("/api/v1/contracts", json={"data": {"number": "CT-NOVO", "customer_id": customer["id"], "creditor_id": creditor["id"], "portfolio_id": portfolio["id"], "amount": "1000.00"}}).json()
    title = client.post("/api/v1/receivables", json={"data": {"number": "TD-NOVO", "customer_id": customer["id"], "contract_id": contract["id"], "portfolio_id": portfolio["id"], "principal": "1000.00", "interest": "25.00", "discount": "5.00", "due_date": date.today().isoformat()}})
    assert title.status_code == 200, title.text
    assert title.json()["balance"] == "1020.00"
    occurrence = client.post("/api/v1/occurrences", json={"data": {"customer_id": customer["id"], "type": "ligacao", "description": "Contato fictício"}})
    assert occurrence.status_code == 200, occurrence.text
    assert occurrence.json()["operator_id"] == admin["id"]


def test_demo_agents_use_authorized_data_and_financial_simulation(db_client):
    client, _, _ = db_client
    login(client)
    customer = client.post("/api/v1/customers", json={"data": {"name": "Cliente Pequeno", "document": "11122233344"}}).json()
    title = client.post("/api/v1/receivables", json={"data": {"customer_id": customer["id"], "number": "PEQ-1", "principal": "60.00", "due_date": date.today().isoformat()}}).json()
    suggestion = client.post("/api/v1/ai/suggest-negotiation", json={"customer_id": customer["id"], "receivable_ids": [title["id"]]})
    assert suggestion.status_code == 200, suggestion.text
    assert suggestion.json()["result"]["proposal"]["installments"] == 1
    message = client.post("/api/v1/ai/generate-message", json={"customer_id": customer["id"]}).json()["result"]
    assert "Nenhuma mensagem foi enviada" in message["notice"]
    answer = client.post("/api/v1/ai/management-query", json={"question": "Quantos acordos estão ativos?"}).json()["result"]
    assert "acordos ativos" in answer["answer"]


def test_dashboard_filters_remain_tenant_scoped(db_client):
    client, initial, _ = db_client
    admin = login(client)
    own_portfolio = next(p for p in initial["records"]["portfolios"] if p["tenant_id"] == admin["tenant_id"])
    other_portfolio = next(p for p in initial["records"]["portfolios"] if p["tenant_id"] != admin["tenant_id"])
    all_data = client.get("/api/v1/dashboard/overview").json()
    filtered = client.get(f"/api/v1/dashboard/overview?portfolio_id={own_portfolio['id']}&days=30")
    assert filtered.status_code == 200
    assert float(filtered.json()["total_collection"]) <= float(all_data["total_collection"])
    assert client.get(f"/api/v1/dashboard/overview?portfolio_id={other_portfolio['id']}").status_code == 404


def test_superadmin_role_still_respects_tenant_boundary(db_client):
    client, initial, _ = db_client
    admin = login(client)
    own_superadmin = next(u for u in initial["users"] if u["tenant_id"] == admin["tenant_id"] and u["role"] == "superadmin")
    assert client.patch(f"/api/v1/users/{own_superadmin['id']}", json={"role": "operator"}).status_code == 403
    superadmin = login(client, "superadmin1@demo.collectai.local")
    assert superadmin["role"] == "superadmin"
    assert client.get("/api/v1/audit").status_code == 200
    foreign_customer = next(c for c in initial["records"]["customers"] if c["tenant_id"] != superadmin["tenant_id"])
    assert client.get(f"/api/v1/customers/{foreign_customer['id']}").status_code == 404
