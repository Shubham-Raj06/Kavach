from fastapi import APIRouter
from app.models.loader import get_models
import os
import time

router = APIRouter()

@router.get("/health")
async def health():
    models = get_models()
    
    # Path to your newest model file to check freshness
    model_path = "app/models/saved/isolation_forest.pkl"
    mtime = os.path.getmtime(model_path) if os.path.exists(model_path) else None
    last_update = time.ctime(mtime) if mtime else "Model file not found"

    return {
        "status": "ok",
        "service": "kavach-ml",
        "modelsLoaded": bool(models),
        "activeModels": list(models.keys()) if models else [],
        "lastModelTraining": last_update,  # This confirms your retrain worked!
        "expectedFeatures": 7
    }