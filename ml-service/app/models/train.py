"""
Model Training Script (Real Data)
Trains XGBoost (Classifier/Regressor) + IsolationForest + Scaler using 7 Core Features.
"""

import os
import numpy as np
import pandas as pd
import joblib
import xgboost as xgb
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report

# Use the same feature names as deployed in engineering.py
CORE_FEATURE_NAMES = [
    "Temperature",
    "Humidity",
    "Rainfall",
    "AQI",
    "Water_Quality_Index",
    "Cases_Rolling_7D",
    "Rainfall_Lag_7D",
]

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "data", "delhi_5yr_outbreak_data.csv")
SAVED_DIR = os.path.join(BASE_DIR, "saved")
os.makedirs(SAVED_DIR, exist_ok=True)

def train():
    print(f"[INFO] Loading data from {DATA_PATH}...")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    
    # ── Feature Engineering ───────────────────────────────────────────────────
    print("[INFO] Preprocessing & Engineering features...")
    
    # Ensure date sorting for rolling windows
    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"])
        df = df.sort_values("Date").reset_index(drop=True)

    # 1. Cases_Rolling_7D: 7-day rolling average of Hospital_Admissions
    # (If Hospital_Admissions is missing, fill with 0 to avoid NaNs, though real data should have it)
    df["Hospital_Admissions"] = df.get("Hospital_Admissions", 0)
    df["Cases_Rolling_7D"] = df["Hospital_Admissions"].rolling(window=7, min_periods=1).mean()

    # 2. Rainfall_Lag_7D: 7-day rolling sum (accumulated rainfall) or simple lag? 
    # Let's use 7-day rolling average to match 'Cases_Rolling_7D' style and capture recent wetness.
    df["Rainfall_Lag_7D"] = df["Rainfall"].rolling(window=7, min_periods=1).mean()

    # Drop NaNs created by rolling windows (though min_periods=1 handles start)
    df = df.dropna(subset=CORE_FEATURE_NAMES)

    X = df[CORE_FEATURE_NAMES].values
    y = df["Outbreak_Label"].values

    # Handle Class Imbalance
    num_pos = sum(y)
    num_neg = len(y) - num_pos
    scale_pos_weight = num_neg / num_pos if num_pos > 0 else 1.0
    print(f"[INFO] Data shape: {X.shape}. Positive samples: {num_pos}, Negative: {num_neg}")
    print(f"[INFO] Using scale_pos_weight: {scale_pos_weight:.2f}")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # ── Scaler ────────────────────────────────────────────────────────────────
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ── XGBoost Classifier ────────────────────────────────────────────────────
    print("[INFO] Training XGBoost classifier...")
    clf = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.03,
        scale_pos_weight=scale_pos_weight,  # Critical for imbalanced data
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
    )
    clf.fit(X_train_scaled, y_train)
    
    y_pred = clf.predict(X_test_scaled)
    report = classification_report(y_test, y_pred)
    print(report)
    with open("classification_report.txt", "w", encoding="utf-8") as f:
        f.write(report)

    # ── XGBoost Regressor (Optional / for Risk Score approximation) ───────────
    # Training this on the binary label essentially makes it a probability estimator,
    # but we can also train it on Hospital_Admissions if we want to predict counts.
    # For now, let's train it on Outbreak_Label (0/1) to align with original code structure.
    print("[INFO] Training XGBoost regressor...")
    reg = xgb.XGBRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        random_state=42,
    )
    reg.fit(X_train_scaled, y_train)

    # ── Isolation Forest (Anomaly Detection) ──────────────────────────────────
    print("[INFO] Training Isolation Forest...")
    # Contamination should match outbreak prevalence roughly, or slightly lower for 'anomalies'
    contamination = max(0.01, min(0.1, num_pos / len(y)))
    iso = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
    )
    iso.fit(X_train_scaled)

    # ── Save Models ───────────────────────────────────────────────────────────
    joblib.dump(clf, os.path.join(SAVED_DIR, "xgb_classifier.pkl"))
    joblib.dump(reg, os.path.join(SAVED_DIR, "xgb_regressor.pkl"))
    joblib.dump(iso, os.path.join(SAVED_DIR, "isolation_forest.pkl"))
    joblib.dump(scaler, os.path.join(SAVED_DIR, "scaler.pkl"))

    print(f"\n[SUCCESS] Models trained on 7 features and saved to {SAVED_DIR}")

if __name__ == "__main__":
    train()
