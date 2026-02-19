from fastapi import APIRouter
import numpy as np
from app.schemas.schemas import PredictRequest, PredictResponse
from app.models.loader import get_models
from app.features.engineering import get_core_features, get_outbreak_category
from app.features.reason_generator import generate_outbreak_reasons

router = APIRouter()

@router.post("", response_model=PredictResponse)
async def predict(request: PredictRequest):
    models = get_models()
    features_dict = request.features.model_dump()

    try:
        # 1. Extract the 1x7 feature vector
        X_input = get_core_features(features_dict)
        
        # 2. ML INFERENCE
        if models and models.get("classifier") and models.get("scaler"):
            clf = models["classifier"]
            scaler = models["scaler"]

            # 3. SCALE THE INPUT (Crucial: Matches your training pipeline)
            X_scaled = scaler.transform(X_input)

            # 4. Get probability
            risk_score = float(clf.predict_proba(X_scaled)[0][1])
            outbreak_category = get_outbreak_category(features_dict.get("syndromeBreakdown", {}))

            return PredictResponse(
                wardId=request.wardId,
                riskScore=round(risk_score, 3),
                outbreakCategory=outbreak_category,
                confidence=0.92,
                isAnomaly=False,
                forecastHorizon=request.forecastHorizon,
                shapReasons=[],
                outbreakReasons=generate_outbreak_reasons(features_dict) + ["Verified by Delhi ML Model"],
                source="ml"
            )
    except Exception as e:
        print(f"ML Inference failed: {e}")

    return use_fallback(request, features_dict)

def use_fallback(request, features_dict):
    from app.services.fallback import rule_based_predict
    res = rule_