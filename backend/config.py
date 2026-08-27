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
MODEL_WEIGHTS_PATH = BASE_DIR / "best.pt"
GEOTAG_CSV_PATH = BASE_DIR / "geotag.csv"

# ── Position calculation (Vincenty direct formula script) ─────────────────────
POSITION_SCRIPT_PATH = BASE_DIR / "position.py"
CALCULATED_POSITIONS_PATH = BASE_DIR / "geotag_calculated.json"

# ── Detection settings ────────────────────────────────────────────────────────
CONFIDENCE_THRESHOLD = 0.25
ALLOWED_EXTENSIONS = {".bmp", ".png", ".jpg", ".jpeg"}

# ── Sonar metadata defaults (used in the generated report) ────────────────────
SONAR_DEFAULTS = {
    "elevation": 12,
    "soundspeed": 1466.2,
    "frequency": "1200k",
}

# ── Fallback vehicle state ────────────────────────────────────────────────────
# Used when an uploaded image has no matching row in geotag.csv: the object
# position is then estimated from this assumed vehicle GPS + sonar geometry.
FALLBACK_VEHICLE = {
    "latitude": 18.922,       # vehicle GPS latitude  (deg)
    "longitude": 72.8347,     # vehicle GPS longitude (deg)
    "heading_deg": 90.0,      # vehicle heading, clockwise from North
    "range_m": 15.0,          # assumed distance to the detected object
    "azimuth_deg": 0.0,       # assumed bearing relative to vehicle heading
}
