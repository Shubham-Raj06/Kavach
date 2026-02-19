from pydantic import BaseModel
from typing import Dict, Any, Optional


class FeatureVector(BaseModel):
    # Admission features
    totalAdmissions7d: float = 0
    totalAdmissions48h: float = 0
    dailyAvg7d: float = 0
    syndromeSpike48h: float = 0
    syndromeBreakdown: Dict[str, float] = {}

    # Water features
    avgChlorine7d: float = 0.5
    currentChlorine: float = 0.5
    chlorineDropRatio: float = 0.0
    avgTurbidity7d: float = 2.0
    currentTurbidity: float = 2.0
    avgPh7d: float = 7.0
    currentPh: float = 7.0
    phDeviation: float = 0.0

    # Weather features
    avgRainfall7d: float = 0
    lagRainfall1d: float = 0
    rainfallSpike: bool = False
    p90Rainfall: float = 0
    avgTemp7d: float = 28.0
    avgHumidity7d: float = 70.0

    # Citizen features
    citizenClusterCount: int = 0
    citizenSeverityScore: float = 1.0

    # Hybrid pipeline fields (from Node feature-service)
    temp_avg: Optional[float] = None
    humidity_avg: Optional[float] = None
    rainfall_total: Optional[float] = None
    wqi: Optional[float] = None

    wardId: Optional[str] = None
    computedAt: Optional[str] = None


class PredictRequest(BaseModel):
    wardId: str
    features: FeatureVector
    forecastHorizon: int = 48


class ShapReason(BaseModel):
    feature: str
    value: float
    impact: float
    direction: str  # "increases" | "decreases"


class PredictResponse(BaseModel):
    wardId: str
    riskScore: float
    outbreakCategory: str
    confidence: float
    isAnomaly: bool
    forecastHorizon: int
    shapReasons: list[ShapReason]
    outbreakReasons: list[str]
    source: str = "ml"


class AnomalyRequest(BaseModel):
    wardId: str
    features: FeatureVector


class AnomalyResponse(BaseModel):
    wardId: str
    isAnomaly: bool
    anomalyScore: float
    anomalyFeatures: list[str]
