"""
resources.py — Resource Optimization Engine.
POST /resources/recommend — given ward risk scores, return recommended resources.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List

router = APIRouter()


class WardInput(BaseModel):
    wardId:     str
    risk_score: float = Field(ge=0, le=100)
    population: int   = Field(default=50000, ge=0)
    area_sqkm:  float = Field(default=2.0, ge=0.1)
    category:   str   = "UNKNOWN"


class WardRecommendation(BaseModel):
    wardId:        str
    risk_level:    str
    ors_packets:   int
    fogging_teams: int
    ambulances:    int
    medical_camps: int
    rationale:     str


@router.post("/recommend", response_model=List[WardRecommendation])
async def recommend(wards: List[WardInput]):
    results = []
    for w in wards:
        if w.risk_score < 25:
            continue  # LOW risk — no active resource deployment

        infection_rate = (w.risk_score / 100) * 0.05   # estimate 5% at CRITICAL
        infected_est   = int(w.population * infection_rate)
        ors_packets    = infected_est * 2

        fogging_teams  = max(1, int(w.area_sqkm / 2)) if w.category in ('VECTOR_BORNE', 'WATERBORNE') else 0
        ambulances     = max(1, int(w.risk_score / 25))
        medical_camps  = 1 if w.risk_score >= 70 else 0

        level = "HIGH" if w.risk_score >= 50 else "MEDIUM"
        if w.risk_score >= 75: level = "CRITICAL"

        rationale = (
            f"Est. {infected_est:,} residents at risk "
            f"({infection_rate*100:.1f}% infection rate at {level} risk). "
        )
        if fogging_teams: rationale += f"Fogging recommended for {w.category}. "
        if medical_camps: rationale += "Deploy medical camp immediately. "

        results.append(WardRecommendation(
            wardId=w.wardId,
            risk_level=level,
            ors_packets=ors_packets,
            fogging_teams=fogging_teams,
            ambulances=ambulances,
            medical_camps=medical_camps,
            rationale=rationale.strip(),
        ))

    return results


@router.post("/hospital-load")
async def hospital_load_forecast(wards: List[WardInput]):
    """
    Simple linear regression estimate of hospital load in 48h.
    In production this would use the trained regression model.
    """
    forecasts = []
    for w in wards:
        # Simplified formula — replace with sklearn regression in production
        base_load = w.risk_score * 0.6
        icu_pct   = max(0, min(100, round(w.risk_score * 0.4, 1)))
        bed_pct   = max(0, min(100, round(base_load, 1)))
        forecasts.append({
            "wardId":        w.wardId,
            "icu_load_pct":  icu_pct,
            "bed_pct_48h":   bed_pct,
            "alert":         "SURGE" if icu_pct > 70 else "NORMAL",
        })
    return forecasts
