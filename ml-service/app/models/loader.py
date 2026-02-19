import os
import joblib
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Use absolute paths to ensure the server finds files regardless of the start directory
BASE_DIR = Path(__file__).resolve().parent

_models = {}

def load_models():
    """Load all model artifacts from disk. Called once at FastAPI startup."""
    global _models
    try:
        # Define absolute paths for all 3 required artifacts (matching train.py output)
        saved_dir = BASE_DIR / "saved"
        classifier_path = saved_dir / "xgb_classifier.pkl"
        scaler_path = saved_dir / "scaler.pkl"
        iso_forest_path = saved_dir / "isolation_forest.pkl"
        
        # Loading artifacts using joblib
        _models = {
            "classifier": joblib.load(classifier_path),
            "scaler": joblib.load(scaler_path),
            "iso_forest": joblib.load(iso_forest_path),
        }
        
        logger.info(f"✅ All 3 models loaded successfully from {BASE_DIR}")
    except FileNotFoundError as e:
        logger.error(f"❌ Critical Error: Model file missing: {e}")
        _models = {}
    except Exception as e:
        logger.error(f"❌ Error loading models: {e}")
        _models = {}
    return _models

def get_models():
    """Getter for the model dictionary. If empty, attempt a reload."""
    global _models
    if not _models:
        return load_models()
    return _models