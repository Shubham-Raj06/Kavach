import requests
import json

URL = "http://localhost:8000/anomaly"

def run_stress_test(name, temp, rainfall, admissions):
    payload = {
        "wardId": "test-zone-1",
        "features": {
            "totalAdmissions7d": admissions,
            "dailyAvg7d": admissions / 7,
            "temp_avg": temp,
            "humidity_avg": 85,
            "rainfall_total": rainfall,
            "wqi": 55, # Normal Water Quality
            "syndromeBreakdown": {"fever": 20}
        }
    }
    
    response = requests.post(URL, json=payload)
    data = response.json()
    
    print(f"--- Test: {name} ---")
    print(f"Input -> Temp: {temp}, Rain: {rainfall}, Admissions: {admissions}")
    print(f"Result -> Is Anomaly: {data.get('isAnomaly')}")
    print(f"Score: {data.get('anomalyScore')}")
    print(f"Flagged Features: {data.get('anomalyFeatures')}\n")

# 1. Normal Scenario (Should be False)
run_stress_test("Normal Delhi Weather", temp=30.0, rainfall=5.0, admissions=20)

# 2. Extreme Heatwave (Should be True)
run_stress_test("Heatwave Stress", temp=52.0, rainfall=0.0, admissions=45)

# 3. Cloudburst/Flood (Should be True)
run_stress_test("Monsoon Flood", temp=25.0, rainfall=450.0, admissions=80)