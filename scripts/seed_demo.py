"""Create reproducible fictional demo data. Existing stores require --reset."""
import argparse
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path
import random
import shutil
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend" / ".deps"))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.config import DATA_PATH
from app.core.security import password_hash
from app.core.storage import change
from app.domain.common import new_id, now


def build() -> dict:
    rng = random.Random(42)
    db = {"tenants": [], "users": [], "sessions": [], "records": {}}
    tenant_names = ["Aurora Recuperação", "Horizonte Serviços"]
    first_names = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Felipe", "Giulia", "Henrique", "Isabela", "João", "Larissa", "Marcos"]
    last_names = ["Almeida", "Barbosa", "Costa", "Dias", "Esteves", "Ferreira", "Gomes", "Lima", "Martins", "Oliveira"]
    shared_hash = password_hash("Demo@12345")
    for tenant_index, name in enumerate(tenant_names):
        tenant_id = new_id()
        db["tenants"].append({"id": tenant_id, "name": name, "mode": "agency" if tenant_index == 0 else "own"})
        users = []
        for role, label in (("admin", "Administrador"), ("supervisor", "Supervisor"), ("operator", "Operador")):
            user = {"id": new_id(), "tenant_id": tenant_id, "name": f"{label} {name.split()[0]}", "email": f"{role}{tenant_index+1}@demo.collectai.local", "role": role, "team_id": None, "password_hash": shared_hash, "active": True}
            users.append(user)
            db["users"].append(user)
        superadmin = {"id": new_id(), "tenant_id": tenant_id, "name": f"Superadministrador {name.split()[0]}", "email": f"superadmin{tenant_index+1}@demo.collectai.local", "role": "superadmin", "team_id": None, "password_hash": shared_hash, "active": True}
        users.append(superadmin)
        db["users"].append(superadmin)
        teams = []
        for index in range(2):
            team = {"id": new_id(), "tenant_id": tenant_id, "name": f"Equipe {index+1}", "supervisor_id": users[1]["id"], "portfolio_ids": [], "status": "active", "created_at": now()}
            teams.append(team)
        db["records"].setdefault("teams", []).extend(teams)
        creditors = []
        count = 3 if tenant_index == 0 else 2
        for index in range(count):
            creditor = {"id": new_id(), "tenant_id": tenant_id, "name": f"{name.split()[0]} Crédito {index+1}", "document": f"{tenant_index+1}{index+1:013d}", "email": f"credor{index+1}@exemplo.local", "phone": "11900000000", "status": "active", "created_at": now()}
            creditors.append(creditor)
        db["records"].setdefault("creditors", []).extend(creditors)
        portfolios = []
        for index in range(4):
            portfolio = {"id": new_id(), "tenant_id": tenant_id, "name": ["Consignado", "Cartões", "Varejo", "Serviços"][index], "code": f"C{tenant_index+1}{index+1:02d}", "creditor_id": creditors[index % len(creditors)]["id"], "description": "Carteira demonstrativa", "responsible": users[1]["name"], "team_id": teams[index % 2]["id"], "status": "active", "created_at": now()}
            portfolios.append(portfolio)
            teams[index % 2]["portfolio_ids"].append(portfolio["id"])
        db["records"].setdefault("portfolios", []).extend(portfolios)
        customers = []
        for index in range(30):
            customer = {"id": new_id(), "tenant_id": tenant_id, "name": f"{first_names[index % len(first_names)]} {last_names[(index + tenant_index) % len(last_names)]} {index+1}", "kind": "person", "document": f"{tenant_index+1}{index+1:010d}", "email": f"cliente{tenant_index+1}-{index+1}@exemplo.local", "phone": f"119{index+1:08d}", "address": "Rua Exemplo, 100", "zip_code": "01001000", "city": "São Paulo", "state": "SP", "notes": "Dados fictícios", "portfolio_id": portfolios[index % 4]["id"], "status": "active", "created_at": now()}
            customers.append(customer)
        db["records"].setdefault("customers", []).extend(customers)
        for index in range(50):
            customer = customers[index % 30]
            portfolio = next(p for p in portfolios if p["id"] == customer["portfolio_id"])
            principal = Decimal(rng.randrange(250, 6500))
            due = date.today() - timedelta(days=rng.randrange(-30, 270))
            contract = {"id": new_id(), "tenant_id": tenant_id, "number": f"CT-{tenant_index+1}-{index+1:04d}", "customer_id": customer["id"], "creditor_id": portfolio["creditor_id"], "portfolio_id": portfolio["id"], "amount": str(principal), "date": (due-timedelta(days=90)).isoformat(), "description": "Contrato demonstrativo", "status": "active", "created_at": now()}
            db["records"].setdefault("contracts", []).append(contract)
            title = {"id": new_id(), "tenant_id": tenant_id, "customer_id": customer["id"], "contract_id": contract["id"], "portfolio_id": portfolio["id"], "number": f"TD-{tenant_index+1}-{index+1:04d}", "principal": str(principal), "interest": "0.00", "fee": "0.00", "discount": "0.00", "balance": str(principal), "due_date": due.isoformat(), "status": "open", "created_at": now()}
            db["records"].setdefault("receivables", []).append(title)
            if index % 3 == 0:
                db["records"].setdefault("occurrences", []).append({"id": new_id(), "tenant_id": tenant_id, "customer_id": customer["id"], "operator_id": users[2]["id"], "type": "ligacao", "channel": "telefone", "description": "Tentativa de contato demonstrativa", "result": "Retorno solicitado", "next_action": "Retornar em 7 dias", "at": now(), "created_at": now()})
        for index, title in enumerate([t for t in db["records"]["receivables"] if t["tenant_id"] == tenant_id][-2:]):
            negotiation_id = new_id()
            agreement_id = new_id()
            principal = Decimal(title["principal"])
            paid = Decimal("100.00") if index == 0 else principal
            title["balance"] = str(principal - paid)
            title["status"] = "in_agreement" if index == 0 else "paid"
            negotiation = {"id": negotiation_id, "tenant_id": tenant_id, "customer_id": title["customer_id"], "receivable_ids": [title["id"]], "original": str(principal), "discount_pct": "0", "discount": "0.00", "total": str(principal), "down_payment": "0.00", "installments": 1, "schedule": [{"number": 1, "due_date": (date.today()+timedelta(days=14)).isoformat(), "amount": str(principal)}], "status": "accepted", "agreement_id": agreement_id, "created_at": now(), "created_by": users[2]["id"]}
            agreement = {"id": agreement_id, "tenant_id": tenant_id, "number": f"AC-{index+1:05d}", "negotiation_id": negotiation_id, "customer_id": title["customer_id"], "receivable_ids": [title["id"]], "title_allocations": [{"receivable_id": title["id"], "original_balance": str(principal), "settlement_due": str(principal)}], "total": str(principal), "paid": str(paid), "balance": str(principal-paid), "status": "active" if index == 0 else "paid", "schedule": [{"number": 1, "due_date": (date.today()+timedelta(days=14)).isoformat(), "amount": str(principal), "paid": str(paid)}], "created_at": now()}
            payment = {"id": new_id(), "tenant_id": tenant_id, "agreement_id": agreement_id, "customer_id": title["customer_id"], "amount": str(paid), "method": "pix", "reference": "SEED-DEMO", "status": "confirmed", "allocations": [{"receivable_id": title["id"], "amount": str(paid)}], "installment_allocations": [{"number": 1, "amount": str(paid)}], "created_at": now(), "confirmed_at": now()}
            db["records"].setdefault("negotiations", []).append(negotiation)
            db["records"].setdefault("agreements", []).append(agreement)
            db["records"].setdefault("payments", []).append(payment)
            db["records"].setdefault("audit", []).append({"id": new_id(), "tenant_id": tenant_id, "user_id": users[1]["id"], "user_name": users[1]["name"], "action": "confirm", "entity": "payments", "entity_id": payment["id"], "details": "Pagamento demonstrativo de seed", "at": now()})
        db["records"].setdefault("notifications", []).append({"id": new_id(), "tenant_id": tenant_id, "title": "Ambiente demonstrativo pronto", "path": "/app/dashboard", "read": False, "at": now()})
        db["records"].setdefault("settings", []).append({"id": new_id(), "tenant_id": tenant_id, "organization": name, "theme": "dark", "notifications": True, "max_discount_pct": 20})
    return db


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Substitui dados atuais após criar backup")
    args = parser.parse_args()
    if DATA_PATH.exists() and not args.reset:
        raise SystemExit(f"{DATA_PATH} já existe. Use --reset para criar backup e recriar.")
    if DATA_PATH.exists():
        backup = DATA_PATH.with_name(f"store-backup-{datetime.now().strftime('%Y%m%d-%H%M%S-%f')}.json")
        shutil.copy2(DATA_PATH, backup)
        print(f"Backup: {backup}")
    initial = build()
    change(lambda db: (db.clear(), db.update(initial)))
    print(f"Dados fictícios criados em {DATA_PATH}: 2 empresas, 5 credores, 8 carteiras, 60 clientes e 100 títulos.")
