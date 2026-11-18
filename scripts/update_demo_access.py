"""Apply the current public demo credentials to the local fictional store."""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend" / ".deps"))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.acessos_demo import DEMO_ACCOUNTS, update_demo_accounts
from app.core.seguranca import password_hash, password_matches
from app.core.storage import change, read


if __name__ == "__main__":
    count = change(lambda db: update_demo_accounts(db, password_hash))
    users = read()["users"]
    for _, email, password in DEMO_ACCOUNTS.values():
        user = next((item for item in users if item["email"] == email), None)
        if not user or not password_matches(password, user["password_hash"]):
            raise SystemExit(f"Falha ao verificar o acesso: {email}")
    print(f"Contas demonstrativas atualizadas: {count}")
