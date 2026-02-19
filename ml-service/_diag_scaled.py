"""Diagnostic: show scaled deviations for each stress test scenario."""
import joblib, numpy as np, sys, os
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.path.insert(0, ".")

s = joblib.load("app/models/scaler.joblib")
from app.features.engineering import get_core_features, CORE_FEATURE_NAMES

tests = [
    ("Normal",   {"temp_avg": 30, "humidity_avg": 85, "rainfall_total": 5,   "wqi": 55, "dailyAvg7d": 2.857}),
    ("Heatwave", {"temp_avg": 52, "humidity_avg": 85, "rainfall_total": 0,   "wqi": 55, "dailyAvg7d": 6.43}),
    ("Flood",    {"temp_avg": 25, "humidity_avg": 85, "rainfall_total": 450, "wqi": 55, "dailyAvg7d": 11.43}),
]

lines = []
for name, feats in tests:
    X = get_core_features(feats)
    Xs = s.transform(X)
    devs = np.abs(Xs[0])
    lines.append(f"--- {name} ---")
    for i in range(7):
        marker = " <<<" if devs[i] == max(devs) else ""
        lines.append(f"  {CORE_FEATURE_NAMES[i]:22s}  raw={float(X[0][i]):8.2f}  dev={float(devs[i]):8.4f}{marker}")
    lines.append("")

with open("_diag2.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("Written to _diag2.txt")
