"""Atomic JSON adapter. Domain code receives dictionaries, never file paths."""
from contextlib import contextmanager
from contextvars import ContextVar
from copy import deepcopy
from pathlib import Path
import json
import os
import tempfile
import time
from typing import Callable, TypeVar

from app.core.config import DATA_PATH

T = TypeVar("T")
_durable_storage: ContextVar[object | None] = ContextVar("durable_storage", default=None)
_DURABLE_KEY = "collectai-demo-v3"


def bind_durable_storage(storage: object):
    """Bind one Durable Object's storage to the current ASGI request."""
    return _durable_storage.set(storage)


def unbind_durable_storage(token) -> None:
    _durable_storage.reset(token)


def _durable_read(storage: object) -> dict:
    raw = storage.kv.get(_DURABLE_KEY)
    if raw is None:
        from app.core.demo_seed import INITIAL_JSON

        raw = INITIAL_JSON
        storage.kv.put(_DURABLE_KEY, raw)
    return json.loads(str(raw))


@contextmanager
def _lock(path: Path):
    lock_path = path.with_suffix(".lock")
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    descriptor = None
    for _ in range(100):
        try:
            descriptor = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(descriptor, str(os.getpid()).encode())
            break
        except FileExistsError:
            time.sleep(0.05)
    if descriptor is None:
        raise TimeoutError("Armazenamento ocupado")
    try:
        yield
    finally:
        os.close(descriptor)
        lock_path.unlink(missing_ok=True)


def _read() -> dict:
    if not DATA_PATH.exists():
        return {"tenants": [], "users": [], "sessions": [], "records": {}}
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def read() -> dict:
    durable = _durable_storage.get()
    if durable is not None:
        return _durable_read(durable)
    return deepcopy(_read())


def change(operation: Callable[[dict], T]) -> T:
    durable = _durable_storage.get()
    if durable is not None:
        # There is no await between the read and write inside this one Durable
        # Object, so another request cannot interleave a financial transition.
        data = _durable_read(durable)
        result = operation(data)
        durable.kv.put(_DURABLE_KEY, json.dumps(data, ensure_ascii=False, default=str))
        return result
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _lock(DATA_PATH):
        data = _read()
        result = operation(data)
        fd, name = tempfile.mkstemp(prefix="collectai-", suffix=".tmp", dir=DATA_PATH.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as file:
                json.dump(data, file, ensure_ascii=False, indent=2, default=str)
                file.flush()
                os.fsync(file.fileno())
            os.replace(name, DATA_PATH)
        finally:
            if os.path.exists(name):
                os.unlink(name)
        return result
