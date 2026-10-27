"""Bundle fictional seed data for the Cloudflare demonstration Worker."""
import base64
import json
from pathlib import Path
import textwrap
import zlib

from seed_demo import build
from app.core.security import demo_password_hash


root = Path(__file__).resolve().parents[1]
fictional = build()
public_demo_hash = demo_password_hash("Demo@12345")
for user in fictional["users"]:
    user["password_hash"] = public_demo_hash
data = json.dumps(fictional, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
encoded = base64.b85encode(zlib.compress(data, level=9)).decode("ascii")
target = root / "backend" / "app" / "core" / "demo_seed.py"
lines = [
    '"""Bundled fictional data; regenerate with python scripts/export_cloudflare_seed.py."""',
    "import base64",
    "import zlib",
    "",
    "INITIAL_JSON = zlib.decompress(base64.b85decode(",
]
lines.extend(f'    "{piece}"' for piece in textwrap.wrap(encoded, 100))
lines.append(')).decode("utf-8")')
target.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Exported {len(data)} fictional bytes to {target}")
