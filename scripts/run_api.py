"""Start local API after installing requirements into backend/.deps."""
from pathlib import Path
import os
import sys

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / "backend" / ".deps"))
sys.path.insert(0, str(root / "backend"))

import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=os.getenv("API_HOST", "127.0.0.1"), port=8000, reload=False)
