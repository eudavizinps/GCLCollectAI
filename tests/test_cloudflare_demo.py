"""The Cloudflare demo must persist changes without touching local JSON data."""
import json

from app.core.storage import bind_durable_storage, change, read, unbind_durable_storage


class FakeKV:
    def __init__(self):
        self.values = {}

    def get(self, key):
        return self.values.get(key)

    def put(self, key, value):
        self.values[key] = value


class FakeStorage:
    def __init__(self):
        self.kv = FakeKV()


def test_demo_storage_seeds_and_persists_without_local_file():
    storage = FakeStorage()
    token = bind_durable_storage(storage)
    try:
        first = read()
        assert len(first["tenants"]) == 2
        first["tenants"].clear()
        assert len(read()["tenants"]) == 2

        change(lambda db: db["records"].setdefault("notifications", []).append({"title": "persisted"}))
        assert read()["records"]["notifications"][-1]["title"] == "persisted"
        assert json.loads(next(iter(storage.kv.values.values())))["records"]["notifications"][-1]["title"] == "persisted"
    finally:
        unbind_durable_storage(token)


def test_failed_demo_change_does_not_persist():
    storage = FakeStorage()
    token = bind_durable_storage(storage)
    try:
        original = read()

        def fail(db):
            db["tenants"].clear()
            raise ValueError("rejected")

        try:
            change(fail)
        except ValueError:
            pass
        else:
            raise AssertionError("Expected rejected change")

        assert read() == original
    finally:
        unbind_durable_storage(token)
