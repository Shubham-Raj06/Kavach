"""
simulate.py — Outbreak Simulation Mode endpoint.
POST /simulate — modify features and get projected risk shift.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from app.models.loader import get_models
from app.features.engineering import get_core_features, get_outbreak_category

router = APIRouter()


class SimulationParams(BaseModel):
    wardId:          str
    current_risk:    float = Field(ge=0, le=100)
    rainfall_delta:  float = Field(default=0, ge=-100, le=500)   # % change
    chlorine_delta:  float = Field(default=0, ge=-100, le=200)   # % change
    symptom_delta:   int   = Field(default=0, ge=-50,  le=200)   # absolute count change
    # Optional overrides
    base_features:   Optional[dict] = None


class SimulationResult(BaseModel):
    wardId:          str
    original_risk:   float
    simulated_risk:  float
    delta:           float
    risk_level:      str
    drivers:         list[str]


def _risk_level(score: float) -> str:
    if score >= 75: return "CRITICAL"
    if score >= 50: return "HIGH"
    if score >= 25: return "MEDIUM"
    return "LOW"


@router.post("", response_model=SimulationResult)
async def simulate(params: SimulationParams):
    models = get_models()

    # Build base feature dict
    base = params.base_features or {
        "rainfall": 5.0,
        "chlorineLevel": 0.5,
        "phLevel": 7.2,
        "turbidity": 1.0,
        "temperature": 32.0,
        "humidity": 70.0,
        "fever_count":    int(params.current_risk * 0.3),
        "diarrhea_count": int(params.current_risk * 0.2),
        "vomiting_count": int(params.current_risk * 0.1),
        "syndromeBreakdown": {"FEVER": int(params.current_risk * 0.3)},
    }

    # Apply scenario deltas
    modified = dict(base)
    modified["rainfall"]       = base.get("rainfall", 5) * (1 + params.rainfall_delta / 100)
    modified["chlorineLevel"]  = max(0, base.get("chlorineLevel", 0.5) * (1 + params.chlorine_delta / 100))
    modified["fever_count"]    = max(0, base.get("fever_count", 0) + params.symptom_delta)
    modified["diarrhea_count"] = max(0, base.get("diarrhea_count", 0) + int(params.symptom_delta * 0.5))

    simulated_score = params.current_risk  # fallback

    try:
        if models and models.get("classifier") and models.get("scaler"):
            X = get_core_features(modified)
            X_scaled = models["scaler"].transform(X)
            prob = float(models["classifier"].predict_proba(X_scaled)[0][1])
            simulated_score = round(prob * 100, 1)
    except Exception as e:
        # Rule-based approximation
        delta = 0.0
        if params.rainfall_delta > 0:  delta += params.rainfall_delta * 0.15
        if params.chlorine_delta < 0:  delta += abs(params.chlorine_delta) * 0.2
        if params.symptom_delta > 0:   delta += params.symptom_delta * 0.3
        simulated_score = round(min(100, max(0, params.current_risk + delta)), 1)

    drivers = []
    if params.rainfall_delta > 10:   drivers.append(f"Rainfall +{params.rainfall_delta:.0f}% increases vector habitat")
    if params.chlorine_delta < -10:  drivers.append(f"Chlorine drop may compromise water safety")
    if params.symptom_delta > 5:     drivers.append(f"+{params.symptom_delta} symptom reports spike detected")
    if not drivers:                   drivers.append("No significant risk drivers in this scenario")

    return SimulationResult(
        wardId=params.wardId,
        original_risk=params.current_risk,
        simulated_risk=simulated_score,
        delta=round(simulated_score - params.current_risk, 1),
        risk_level=_risk_level(simulated_score),
        drivers=drivers,
    )
