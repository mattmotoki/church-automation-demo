"""
Core configuration for the Railway API
"""
import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

# API settings
API_PREFIX = "/api"
HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", 8000))

# CORS settings
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://church-documentation-automation.vercel.app",
    "https://church-documentation-automation-mattmotokis-projects.vercel.app",
    "https://church-documentation-automation-production.up.railway.app",
]

# File paths
HYMNS_DATA_DIR = DATA_DIR / "hymns"
TEMPLATES_DIR = DATA_DIR / "templates"