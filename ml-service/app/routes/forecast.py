"""
GET /forecast/{ward_id}
Prophet-based 48-hour admission forecast
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

router = APIRouter()


class ForecastPoint(BaseModel):
    time: str
    riskScore: float
    admissions: float
    lower: float
    upper: float


class ForecastResponse(BaseModel):
    wardId: str
    horizon: int
    points: List[ForecastPoint]
    source: str


@router.get("/{ward_id}", response_model=ForecastResponse)
async def forecast(ward_id: str, horizon: int = 48):
    """
    Returns a 48-hour forecast.
    Uses Prophet if available, otherwise generates a synthetic trend.
    """
    try:
        from prophet import Prophet

        # In production: load real historical data from DB via backend call
        # For now: generate synthetic historical data to demo Prophet
        now = datetime.utcnow()
        dates = [now - timedelta(hours=i) for i in range(30 * 24, 0, -1)]
        values = [
            20 + 5 * np.sin(i * 2 * np.pi / 24) +  # daily cycle
            2 * np.sin(i * 2 * np.pi / (24 * 7)) +  # weekly cycle
            np.random.normal(0, 2)
            for i in range(len(dates))
        ]

        df = pd.DataFrame({"ds": dates, "y": values})
        model = Prophet(
            daily_seasonality=True,
            weekly_seasonality=True,
            changepoint_prior_scale=0.05,
        )
        model.fit(df)

        future = model.make_future_dataframe(periods=horizon, freq="H")
        forecast_df = model.predict(future)
        future_only = forecast_df.tail(horizon)

        points = []
        for _, row in future_only.iterrows():
            admissions = max(0, row["yhat"])
            # Risk score: normalize admissions to 0-100 scale
            risk = min(100, max(0, (admissions / 40) * 100))
            points.append(ForecastPoint(
                time=row["ds"].strftime("%H:%M"),
                riskScore=round(risk, 1),
                admissions=round(admissions, 1),
                lower=round(max(0, row["yhat_lower"]), 1),
                upper=round(row["yhat_upper"], 1),
            ))

        return ForecastResponse(wardId=ward_id, horizon=horizon, points=points, source="prophet")

    except ImportError:
        # Prophet not installed — return synthetic trend
        return _synthetic_forecast(ward_id, horizon)
    except Exception:
        return _synthetic_forecast(ward_id, horizon)


def _synthetic_forecast(ward_id: str, horizon: int) -> ForecastResponse:
    """Synthetic fallback forecast when Prophet is unavailable."""
    now = datetime.utcnow()
    points = []
    for i in range(horizon):
        t = now + timedelta(hours=i)
        admissions = 15 + 5 * np.sin(i * 2 * np.pi / 24) + np.random.normal(0, 1.5)
        admissions = max(0, admissions)
        # Simulate escalating risk in later hours
        trend = 1 + (i / horizon) * 0.8
        risk = min(100, (admissions / 40) * 100 * trend)
        points.append(ForecastPoint(
            time=t.strftime("%H:%M"),
            riskScore=round(risk, 1),
            admissions=round(admissions, 1),
            lower=round(max(0, admissions - 3), 1),
            upper=round(admissions + 3, 1),
        ))
    return ForecastResponse(wardId=ward_id, horizon=horizon, points=points, source="synthetic")
