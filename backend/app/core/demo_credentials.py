"""Public credentials used only by the fictional CollectAI demonstration."""

from app.domain.common import audit, new_id


DEMO_ACCOUNTS = {
    "admin": ("admin1@demo.collectai.local", "adminteste@collectai.local", "admin1234"),
    "supervisor": ("supervisor1@demo.collectai.local", "supteste@collectai.local", "sup1234"),
    "operator": ("operator1@demo.collectai.local", "opteste@collectai.local", "op12345"),
}
DEMO_ACCOUNTS_VERSION = 1


def password_for_demo_user(user: dict) -> str:
    for _, email, password in DEMO_ACCOUNTS.values():
        if user["email"] == email:
            return password
    return "Demo@12345"


def update_demo_accounts(db: dict, hash_password) -> int:
    """Set fictional test accounts once without replacing other demo data."""
    if db.get("demo_accounts_version") == DEMO_ACCOUNTS_VERSION:
        return 0
    tenant = next(
        (item for item in db["tenants"] if item["name"] == "Aurora Recuperação"),
        None,
    )
    if tenant is None:
        return 0

    actor = {"id": "demo-system", "name": "Sistema demonstrativo", "tenant_id": tenant["id"]}
    changed_ids = set()
    for role, (old_email, email, password) in DEMO_ACCOUNTS.items():
        user = next(
            (
                item
                for item in db["users"]
                if item["tenant_id"] == tenant["id"]
                and item["role"] == role
                and item["email"].casefold() in (old_email, email)
            ),
            None,
        )
        if user is None:
            user = {
                "id": new_id(),
                "tenant_id": tenant["id"],
                "name": f"{role.title()} Teste",
                "role": role,
                "team_id": None,
            }
            db["users"].append(user)
        user.update(email=email, password_hash=hash_password(password), active=True)
        if role == "operator" and not user.get("team_id"):
            team = next(
                (
                    item
                    for item in db["records"].get("teams", [])
                    if item["tenant_id"] == tenant["id"]
                ),
                None,
            )
            if team:
                user["team_id"] = team["id"]
        audit(db, actor, "reset_demo_access", "users", user["id"])
        changed_ids.add(user["id"])

    db["sessions"] = [
        session for session in db["sessions"] if session["user_id"] not in changed_ids
    ]
    db["demo_accounts_version"] = DEMO_ACCOUNTS_VERSION
    return len(changed_ids)
