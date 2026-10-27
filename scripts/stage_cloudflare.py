"""Prepare an isolated Cloudflare Worker directory for Linux CI builds."""
from pathlib import Path
import shutil


root = Path(__file__).resolve().parents[1]
stage = root / ".cloudflare-build"
resolved_root = root.resolve()
resolved_stage = stage.resolve()
if not resolved_stage.is_relative_to(resolved_root) or resolved_stage == resolved_root:
    raise SystemExit("Refusing to replace a directory outside the repository")

assets = root / "frontend" / "dist"
if not (assets / "index.html").is_file():
    raise SystemExit("Frontend build missing. Run npm ci and npm run build in frontend first.")

if stage.exists():
    shutil.rmtree(stage)
(stage / "src").mkdir(parents=True)
shutil.copytree(root / "backend" / "app", stage / "src" / "app", ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
shutil.copy2(root / "cloudflare" / "worker.py", stage / "src" / "worker.py")
shutil.copy2(root / "cloudflare" / "wrangler.jsonc", stage / "wrangler.jsonc")
shutil.copy2(root / "cloudflare" / "pyproject.toml", stage / "pyproject.toml")
shutil.copytree(assets, stage / "public")
print(f"Cloudflare build staged at {stage}")
