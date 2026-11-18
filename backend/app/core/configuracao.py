from pathlib import Path
import os

ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = Path(os.getenv("COLLECTAI_DATA_PATH", ROOT / "data" / "store.json"))
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
AI_PROVIDER = os.getenv("AI_PROVIDER", "demo")
