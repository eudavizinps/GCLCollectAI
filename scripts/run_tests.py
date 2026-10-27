from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / "backend" / ".deps"))
sys.path.insert(0, str(root / "backend"))
import pytest

raise SystemExit(pytest.main([str(root / "tests"), "-q"]))
