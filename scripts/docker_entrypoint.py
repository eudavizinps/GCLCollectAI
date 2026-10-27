from pathlib import Path
import runpy

if not Path("backend/data/store.json").exists():
    runpy.run_path("scripts/seed_demo.py", run_name="__main__")
runpy.run_path("scripts/run_api.py", run_name="__main__")
