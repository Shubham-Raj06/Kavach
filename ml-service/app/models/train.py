"""
Model Training Script
Run once to train and save XGBoost + IsolationForest models.

Usage:
    python -m app.models.train

Generates synthetic training data based on epidemiological rules,
then trains and saves models to app/models/saved/
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
import xgboost as xgb

from app.features.engineering import FEATURE_NAMES

SAVED_DIR = os.path.join(os.path.dirname(__file__), "saved")
os.makedirs(SAVED_DIR, exist_ok=True)

N_SAMPLES = 5000
np.random.seed(42)


def generate_synthetic_data(n=N_SAMPLES):
    """
    Generate synthetic training data based on epidemiological rules.
    High risk = chlorine drop + syndrome spike + rainfall + citizen cluster.
    """
    data = []
    labels = []

    for _ in range(n):
        # Base features
        chlorine_drop = np.random.beta(2, 5)          # mostly low, sometimes high
        syndrome_spike = np.random.exponential(0.8)    # mostly <1, occasionally >3
        lag_rainfall = np.random.exponential(10)
        citizen_cluster = np.random.poisson(3)
        turbidity = np.random.exponential(2)
        ph_dev = np.random.exponential(0.3)
        humidity = np.random.uniform(50, 95)
        temp = np.random.uniform(20, 38)
        admissions_7d = np.random.poisson(50)
        admissions_48h = np.random.poisson(15)
        daily_avg = admissions_7d / 7

        # Syndrome one-hot (proportions)
        syndrome_probs = np.random.dirichlet([3, 2, 2, 1, 1, 1, 1])

        row = [
            admissions_7d,
            admissions_48h,
            daily_avg,
            syndrome_spike,
            chlorine_drop,
            max(0, 0.8 - chlorine_drop * 0.8),   # current chlorine
            turbidity,
            ph_dev,
            lag_rainfall,
            lag_rainfall * 0.6,                    # avg rainfall 7d
            float(lag_rainfall > 30),              # rainfall spike
            temp,
            humidity,
            citizen_cluster,
            np.random.uniform(1, 5),               # severity score
            *syndrome_probs,
        ]

        # Risk score: weighted combination
        risk = (
            chlorine_drop * 0.35 +
            min(syndrome_spike / 5, 1) * 0.30 +
            min(lag_rainfall / 50, 1) * 0.15 +
            min(citizen_cluster / 20, 1) * 0.10 +
            min(turbidity / 10, 1) * 0.10
        )

        # Add noise
        risk = np.clip(risk + np.random.normal(0, 0.05), 0, 1)

        # Binary label: high risk if score > 0.6
        label = int(risk > 0.6)

        data.append(row)
        labels.append(label)

    df = pd.DataFrame(data, columns=FEATURE_NAMES)
    df["risk_score"] = [
        np.clip(
            row[3] * 0.30 + row[4] * 0.35 + min(row[8] / 50, 1) * 0.15 +
            min(row[13] / 20, 1) * 0.10 + min(row[6] / 10, 1) * 0.10 +
            np.random.normal(0, 0.05), 0, 1
        )
        for row in data
    ]
    df["label"] = labels
    return df


def train():
    print("🔧 Generating synthetic training data...")
    df = generate_synthetic_data()

    X = df[FEATURE_NAMES].values
    y_class = df["label"].values
    y_score = df["risk_score"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y_class, test_size=0.2, random_state=42)

    # ── Scaler ────────────────────────────────────────────────────────────────
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ── XGBoost Classifier ────────────────────────────────────────────────────
    print("🤖 Training XGBoost classifier...")
    clf = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
    )
    clf.fit(X_train_scaled, y_train)
    y_pred = clf.predict(X_test_scaled)
    print(classification_report(y_test, y_pred))

    # ── XGBoost Regressor (risk score) ────────────────────────────────────────
    print("📈 Training XGBoost risk score regressor...")
    X_score_train, X_score_test, y_score_train, y_score_test = train_test_split(
        X, y_score, test_size=0.2, random_state=42
    )
    X_score_train_s = scaler.transform(X_score_train)

    reg = xgb.XGBRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        random_state=42,
    )
    reg.fit(X_score_train_s, y_score_train)

    # ── Isolation Forest (anomaly detection) ──────────────────────────────────
    print("🔍 Training Isolation Forest...")
    iso = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42,
    )
    iso.fit(X_train_scaled)

    # ── Save Models ───────────────────────────────────────────────────────────
    joblib.dump(clf, os.path.join(SAVED_DIR, "xgb_classifier.pkl"))
    joblib.dump(reg, os.path.join(SAVED_DIR, "xgb_regressor.pkl"))
    joblib.dump(iso, os.path.join(SAVED_DIR, "isolation_forest.pkl"))
    joblib.dump(scaler, os.path.join(SAVED_DIR, "scaler.pkl"))

    print(f"\n✅ Models saved to {SAVED_DIR}")
    print("   xgb_classifier.pkl")
    print("   xgb_regressor.pkl")
    print("   isolation_forest.pkl")
    print("   scaler.pkl")


if __name__ == "__main__":
    train()
