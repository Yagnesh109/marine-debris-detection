"""
Central configuration for the Debris Detector backend.

Every path and tunable value used by the application lives here so that
routers and services never hard-code locations or magic numbers.
"""

from pathlib import Path

# ── Application ───────────────────────────────────────────────────────────────
APP_NAME = "Debris Detector API"
API_HOST = "127.0.0.1"
API_PORT = 8000

# ── Directories ───────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent          # .../backend
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"                   # original uploaded images
RESULT_DIR = DATA_DIR / "results"                   # YOLO annotated images

# ── Model & dataset files ─────────────────────────────────────────────────────
MODEL_WEIGHTS_PATH = BASE_DIR / "bestv2.pt"
GEOTAG_CSV_PATH = BASE_DIR / "geotag.csv"

# ── Position calculation (Vincenty direct formula script) ─────────────────────
POSITION_SCRIPT_PATH = BASE_DIR / "position.py"
CALCULATED_POSITIONS_PATH = BASE_DIR / "geotag_calculated.json"

# ── Detection settings ────────────────────────────────────────────────────────
CONFIDENCE_THRESHOLD = 0.25
ALLOWED_EXTENSIONS = {".bmp", ".png", ".jpg", ".jpeg"}

# Sonar geometry is supplied by each uploaded XML annotation.
# Demo ship origin used until live ship GPS data is connected.
DEMO_SHIP_LATITUDE = 18.922
DEMO_SHIP_LONGITUDE = 72.8347
