"""
Outbreak Reason Generator

Converts raw feature values into human-readable AI insight strings.
These power the "AI Insight Box" on the frontend dashboard.
"""

from typing import Dict, Any, List


def generate_outbreak_reasons(features: Dict[str, Any]) -> List[str]:
    """
    Rule-based reason generator.
    Returns a list of human-readable strings explaining why a ward is high risk.
    """
    reasons = []

    # ── Water Quality Signals ─────────────────────────────────────────────────
    chlorine_drop = features.get("chlorineDropRatio", 0)
    if chlorine_drop >= 0.5:
        reasons.append(f"🔵 Chlorine dropped {round(chlorine_drop * 100)}% vs 7-day average (critical)")
    elif chlorine_drop >= 0.3:
        reasons.append(f"🔵 Chlorine dropped {round(chlorine_drop * 100)}% vs 7-day average")

    turbidity = features.get("currentTurbidity", 0)
    if turbidity > 10:
        reasons.append(f"⚠️ Turbidity critically high ({turbidity:.1f} NTU — safe limit: 5)")
    elif turbidity > 5:
        reasons.append(f"⚠️ Turbidity above safe threshold ({turbidity:.1f} NTU)")

    ph = features.get("currentPh", 7.0)
    if ph < 6.0 or ph > 9.0:
        reasons.append(f"🧪 pH level unsafe ({ph:.1f} — safe range: 6.5–8.5)")
    elif ph < 6.5 or ph > 8.5:
        reasons.append(f"🧪 pH level borderline ({ph:.1f})")

    # ── Syndrome / Admission Signals ──────────────────────────────────────────
    spike = features.get("syndromeSpike48h", 0)
    syndrome_breakdown = features.get("syndromeBreakdown", {})
    dominant = max(syndrome_breakdown, key=syndrome_breakdown.get) if syndrome_breakdown else None

    if spike >= 3.0 and dominant:
        reasons.append(f"🔴 {dominant.replace('_', ' ').title()} cases ↑ {spike:.1f}× in last 48h (severe spike)")
    elif spike >= 2.0 and dominant:
        reasons.append(f"🔴 {dominant.replace('_', ' ').title()} cases ↑ {spike:.1f}× vs baseline")
    elif spike >= 1.5 and dominant:
        reasons.append(f"🟠 {dominant.replace('_', ' ').title()} cases elevated ({spike:.1f}× baseline)")

    admissions_48h = features.get("totalAdmissions48h", 0)
    if admissions_48h > 50:
        reasons.append(f"🏥 {int(admissions_48h)} hospital admissions in last 48h")

    # ── Weather / Environmental Signals ──────────────────────────────────────
    lag_rainfall = features.get("lagRainfall1d", 0)
    p90 = features.get("p90Rainfall", 20)
    if lag_rainfall > p90 * 1.5:
        reasons.append(f"🌧️ Extreme rainfall yesterday ({lag_rainfall:.0f}mm — {lag_rainfall/max(p90,1):.1f}× 90th percentile)")
    elif lag_rainfall > p90:
        reasons.append(f"🌧️ Rainfall spike yesterday ({lag_rainfall:.0f}mm above 90th percentile)")

    humidity = features.get("avgHumidity7d", 0)
    temp = features.get("avgTemp7d", 0)
    if humidity > 85 and temp > 30:
        reasons.append(f"🌡️ High heat-humidity index (temp {temp:.0f}°C, humidity {humidity:.0f}%) — vector breeding conditions")

    # ── Citizen Report Signals ────────────────────────────────────────────────
    cluster_count = features.get("citizenClusterCount", 0)
    severity_score = features.get("citizenSeverityScore", 1)

    if cluster_count >= 20:
        reasons.append(f"📍 {cluster_count} citizen complaints clustered in last 24h (high density)")
    elif cluster_count >= 10:
        reasons.append(f"📍 {cluster_count} citizen complaints in last 24h")
    elif cluster_count >= 5:
        reasons.append(f"📍 {cluster_count} citizen reports in last 24h")

    if severity_score >= 4.0:
        reasons.append(f"🚨 Citizen-reported severity critical (avg {severity_score:.1f}/5)")
    elif severity_score >= 3.0:
        reasons.append(f"🟠 Citizen-reported severity high (avg {severity_score:.1f}/5)")

    # ── Fallback ──────────────────────────────────────────────────────────────
    if not reasons:
        reasons.append("ℹ️ Elevated risk based on combined environmental and epidemiological signals")

    return reasons


def shap_to_reasons(shap_values: list, feature_names: list, feature_labels: dict) -> List[str]:
    """
    Converts SHAP values into human-readable impact strings.
    Returns top 3 most impactful features.
    """
    if not shap_values or not feature_names:
        return []

    paired = list(zip(feature_names, shap_values))
    # Sort by absolute SHAP impact descending
    paired.sort(key=lambda x: abs(x[1]), reverse=True)

    reasons = []
    for feature, impact in paired[:3]:
        label = feature_labels.get(feature, feature)
        direction = "increases" if impact > 0 else "decreases"
        reasons.append(f"📊 {label} {direction} outbreak risk (SHAP: {impact:+.3f})")

    return reasons
