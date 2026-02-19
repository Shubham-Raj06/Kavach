"""
Model Verification Script
Checks timestamps and feature counts for the core ML model files.
"""

import os
import time
import joblib
import sys

MODELS_DIR = os.path.join(os.path.dirname(__file__), "app", "models")
EXPECTED_FEATURES = 7
MAX_AGE_SECONDS = 5 * 60  # 5 minutes

FILES_TO_CHECK = [
    "delhi_outbreak_model.joblib",
    "scaler.joblib",
    "iso_forest.joblib",
]


def check_timestamps():
    """Verify all model files exist and were modified within the last 5 minutes."""
    now = time.time()
    print("=" * 60)
    print("  MODEL TIMESTAMP CHECK")
    print("=" * 60)

    errors = []
    for filename in FILES_TO_CHECK:
        path = os.path.join(MODELS_DIR, filename)
        if not os.path.exists(path):
            msg = f"  [FAIL] MISSING: {filename}"
            print(msg)
            errors.append(msg)
            continue

        mtime = os.path.getmtime(path)
        age_seconds = now - mtime
        age_str = f"{age_seconds:.0f}s ago"
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(mtime))
        size_kb = os.path.getsize(path) / 1024

        if age_seconds > MAX_AGE_SECONDS:
            status = "[WARN] STALE"
            msg = f"  {status}: {filename} -- last modified {timestamp} ({age_str}, {size_kb:.1f} KB)"
            print(msg)
            errors.append(f"{filename} is older than 5 minutes ({age_str})")
        else:
            print(f"  [OK] FRESH: {filename} -- last modified {timestamp} ({age_str}, {size_kb:.1f} KB)")

    return errors


def check_scaler_features():
    """Load scaler.joblib and verify it expects exactly 7 features."""
    print("\n" + "=" * 60)
    print("  SCALER FEATURE COUNT CHECK")
    print("=" * 60)

    scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
    if not os.path.exists(scaler_path):
        msg = "scaler.joblib not found -- cannot verify feature count"
        print(f"  [FAIL] {msg}")
        return [msg]

    scaler = joblib.load(scaler_path)
    n_features = getattr(scaler, "n_features_in_", None)

    if n_features is None:
        msg = "scaler has no 'n_features_in_' attribute -- might be an older sklearn version"
        print(f"  [WARN] {msg}")
        return [msg]

    print(f"  scaler.n_features_in_ = {n_features}")

    if n_features != EXPECTED_FEATURES:
        msg = f"Feature count mismatch! Expected {EXPECTED_FEATURES}, got {n_features}"
        print(f"  [FAIL] {msg}")
        return [msg]

    print(f"  [OK] Scaler expects exactly {EXPECTED_FEATURES} features -- CORRECT")
    return []


if __name__ == "__main__":
    errors = []
    errors += check_timestamps()
    errors += check_scaler_features()

    print("\n" + "=" * 60)
    if errors:
        print("  [FAIL] VERIFICATION FAILED")
        for e in errors:
            print(f"     • {e}")
        print("=" * 60)
        sys.exit(1)
    else:
        print("  [OK] ALL CHECKS PASSED")
        print("=" * 60)
        sys.exit(0)
