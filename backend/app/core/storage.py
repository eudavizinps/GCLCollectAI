"""Atomic JSON adapter. Domain code receives dictionaries, never file paths."""
from contextlib import contextmanager
from copy import deepcopy
from pathlib import Path
import json
import os
import tempfile
import time
from typing import Callable, TypeVar

from app.core.config import DATA_PATH

T = TypeVar("T")


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
    return deepcopy(_read())


def change(operation: Callable[[dict], T]) -> T:
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
