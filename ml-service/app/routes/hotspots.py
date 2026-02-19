"""
GET /hotspots
DBSCAN-based geo-clustering of high-risk wards.
Returns GeoJSON FeatureCollection for Mapbox hotspot circles.
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

router = APIRouter()


class HotspotFeature(BaseModel):
    type: str = "Feature"
    geometry: dict
    properties: dict


class HotspotResponse(BaseModel):
    type: str = "FeatureCollection"
    features: List[HotspotFeature]
    clusterCount: int


@router.post("", response_model=HotspotResponse)
async def compute_hotspots(wards: List[dict]):
    """
    Input: list of ward objects with { wardId, latitude, longitude, riskScore }
    Output: GeoJSON FeatureCollection with hotspot cluster circles
    """
    # Filter to high-risk wards only (riskScore >= 0.6)
    high_risk = [w for w in wards if (w.get("riskScore") or 0) >= 0.6]

    if not high_risk:
        return HotspotResponse(type="FeatureCollection", features=[], clusterCount=0)

    try:
        from sklearn.cluster import DBSCAN

        coords = np.array([[w["latitude"], w["longitude"]] for w in high_risk])

        # DBSCAN: eps in degrees (~1km = 0.009 degrees), min_samples=1
        db = DBSCAN(eps=0.015, min_samples=1, metric="haversine").fit(np.radians(coords))
        labels = db.labels_

        # Group wards by cluster
        clusters = {}
        for i, label in enumerate(labels):
            if label == -1:
                continue  # noise
            clusters.setdefault(label, []).append(high_risk[i])

        features = []
        for label, cluster_wards in clusters.items():
            avg_lat = np.mean([w["latitude"] for w in cluster_wards])
            avg_lon = np.mean([w["longitude"] for w in cluster_wards])
            max_risk = max(w.get("riskScore", 0) for w in cluster_wards)
            ward_names = [w.get("name", w["wardId"]) for w in cluster_wards]

            features.append(HotspotFeature(
                type="Feature",
                geometry={
                    "type": "Point",
                    "coordinates": [avg_lon, avg_lat],
                },
                properties={
                    "clusterId": int(label),
                    "wardCount": len(cluster_wards),
                    "maxRiskScore": round(max_risk, 3),
                    "wardNames": ward_names,
                    "radius": 800 + len(cluster_wards) * 200,  # meters for Mapbox circle
                    "severity": "CRITICAL" if max_risk >= 0.8 else "HIGH",
                },
            ))

        return HotspotResponse(
            type="FeatureCollection",
            features=features,
            clusterCount=len(clusters),
        )

    except ImportError:
        # sklearn not available — return each high-risk ward as its own hotspot
        features = [
            HotspotFeature(
                type="Feature",
                geometry={"type": "Point", "coordinates": [w["longitude"], w["latitude"]]},
                properties={
                    "clusterId": i,
                    "wardCount": 1,
                    "maxRiskScore": w.get("riskScore", 0),
                    "wardNames": [w.get("name", w["wardId"])],
                    "radius": 600,
                    "severity": "CRITICAL" if w.get("riskScore", 0) >= 0.8 else "HIGH",
                },
            )
            for i, w in enumerate(high_risk)
        ]
        return HotspotResponse(type="FeatureCollection", features=features, clusterCount=len(features))
