"""Rule-based fallback when ML models are not yet trained."""

from app.features.engineering import get_outbreak_category


def rule_based_predict(features: dict) -> dict:
    chlorine_drop = features.get("chlorineDropRatio", 0)
    syndrome_spike = features.get("syndromeSpike48h", 0)
    lag_rainfall = features.get("lagRainfall1d", 0)
    citizen_cluster = features.get("citizenClusterCount", 0)
    turbidity = features.get("currentTurbidity", 0)

    score = min(1.0,
        chlorine_drop * 0.35 +
        min(syndrome_spike / 5, 1) * 0.30 +
        min(lag_rainfall / 50, 1) * 0.15 +
        min(citizen_cluster / 20, 1) * 0.10 +
        min(turbidity / 10, 1) * 0.10
    )

    return {
        "riskScore": round(score, 3),
        "outbreakCategory": get_outbreak_category(features.get("syndromeBreakdown", {})),
        "confidence": 0.6,
        "isAnomaly": score > 0.7,
    }
