from fastapi import APIRouter
import numpy as np
from app.schemas.schemas import AnomalyRequest, AnomalyResponse
from app.features.engineering import get_core_features, CORE_FEATURE_NAMES
from app.models.loader import get_models

router = APIRouter()

@router.post("", response_model=AnomalyResponse)
async def detect_anomaly(request: AnomalyRequest):
    features_dict = request.features.model_dump()
    X = get_core_features(features_dict)
    models = get_models()

    if not models or not all(k in models for k in ["scaler", "iso_forest"]):
        return AnomalyResponse(wardId=request.wardId, isAnomaly=False, anomalyScore=0.0, anomalyFeatures=[])

    scaler = models["scaler"]
    iso = models["iso_forest"]

    # 1. Scale and Score
    X_scaled = scaler.transform(X)
    prediction = iso.predict(X_scaled)[0] # 1 = normal, -1 = anomaly
    score = float(iso.decision_function(X_scaled)[0])

    # 2. Enhanced Trigger Logic
    # We trigger if the model says -1 OR if the score is near the boundary
    is_anomaly = (prediction == -1) or (score < 0.02)

    # 3. Identify Culprit Features
    # KEY INSIGHT: Using raw z-scores (raw - mean / std) creates a "sensitivity
    # trap" — low-variance features like WQI (std=1.33) produce enormous z-scores
    # (z=36 for wqi=55) that drown out genuinely extreme events like a 52C heatwave
    # (z=2.1) or 450mm flood (z=17.5).
    #
    # FIX: Rank by |X_scaled| instead. After StandardScaler, all features share
    # unit variance, so the absolute scaled value is a fair, apples-to-apples
    # measure of "how unusual is this feature relative to training data?"
    anomaly_features = []
    if is_anomaly:
        deviations = np.abs(X_scaled[0])

        # Pick any feature with scaled deviation > 2.0 (i.e., >2 std from mean)
        significant_mask = deviations > 2.0
        significant_indices = np.where(significant_mask)[0]

        if len(significant_indices) == 0:
            # Multivariate anomaly — no single extreme feature, flag top 2
            significant_indices = np.argsort(deviations)[-2:]

        # Sort selected features by severity (most extreme first)
        significant_indices = sorted(significant_indices, key=lambda i: deviations[i], reverse=True)
        anomaly_features = [CORE_FEATURE_NAMES[i] for i in significant_indices]

    return AnomalyResponse(
        wardId=request.wardId,
        isAnomaly=is_anomaly,
        anomalyScore=round(score, 4),
        anomalyFeatures=anomaly_features,
    )