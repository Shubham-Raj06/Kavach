# 🎬 Kavach Demo Script — Winning Presentation Flow

## Prerequisites

```bash
# Terminal 1 — Backend
cd backend && npm install && npx prisma migrate dev && node prisma/seed.js && npm start

# Terminal 2 — ML Service
cd ml-service && pip install -r requirements.txt
python -m app.models.train          # Train XGBoost + Isolation Forest models
uvicorn main:app --port 8000 --reload

# Terminal 3 — Frontend
cd frontend && npm install && npm run dev
```

---

## Step 1 — Login

1. Open `http://localhost:3000/login`
2. Click **GOV** quick-login button → credentials auto-fill
3. Click **Sign In** → redirected to `/dashboard`

---

## Step 2 — Show Ward Heatmap

1. The Mapbox map loads with all Mumbai wards
2. Wards are color-coded:
   - 🔴 **Red** — Critical risk (≥ 80%)
   - 🟠 **Orange** — High risk (≥ 60%)
   - 🟡 **Yellow** — Medium risk
   - 🟢 **Green** — Low risk
3. **Ward 1 (Dharavi)** should already be red from seed data

---

## Step 3 — Inject Spike in Diarrhea Cases

```bash
# POST new hospital admissions to simulate outbreak escalation
curl -X POST http://localhost:5000/api/hospital \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "wardId": "WARD_001",
    "patientCount": 25,
    "syndromeType": "DIARRHEA",
    "reportedAt": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"
  }'
```

---

## Step 4 — Run AI Prediction

1. Click **Ward 1 (Dharavi)** on the map
2. The bottom panel opens showing the ward detail
3. Click **"Run AI"** button in the tab bar
4. Watch the spinner → **Risk Score jumps to CRITICAL (82%)**
5. Category badge shows: 💧 **WATERBORNE**

---

## Step 5 — View Explainability ("Why High Risk?")

1. The **🔬 Why High Risk?** tab is active by default
2. You'll see color-coded reason cards:
   - 🔴 `DIARRHEA cases ↑ 2.3× in last 48h`
   - 🔵 `Chlorine dropped 40% vs 7-day avg`
   - 🌧️ `Rainfall spike of 22mm yesterday`
   - 📍 `7 citizen complaints in last 24h`
3. If ML model is loaded: **SHAP feature impact** table appears below

---

## Step 6 — View 48-Hour Forecast

1. Click the **📈 48h Forecast** tab
2. Area chart shows:
   - Blue line: **Risk Score %** trending upward
   - Orange line: **Hospital Admissions** count
   - Red dashed line: **Alert threshold at 70%**
3. Forecast shows escalation in hours 16–24

---

## Step 7 — Alert Triggers

1. Since risk > 70%, an alert was **auto-created** during prediction
2. Click **🔔 Alerts** tab → see the CRITICAL alert for Ward 1
3. Navigate to `/alerts` page → full alerts dashboard with:
   - Stats: Total / Critical / High / Active counts
   - Filter by severity
   - Each alert shows recommended action

---

## Step 8 — Syndrome Breakdown

1. Click **🧬 Syndromes** tab
2. Bar chart shows syndrome distribution for Ward 1:
   - DIARRHEA dominant (seeded with 15 admissions)
   - Confirms WATERBORNE outbreak category

---

## Step 9 — Hotspot Clusters

The map automatically shows **hotspot circles** for clusters of high-risk wards:
- DBSCAN clustering groups nearby high-risk wards
- Circle radius scales with cluster size
- Hover for cluster details

---

## Step 10 — Mobile Citizen App

```bash
cd mobile && npm install && npx expo start
```

1. **HomeScreen**: Shows local ward risk badge + AI advisory
2. **ReportScreen**: Citizen submits symptom report → stored in DB
3. **AlertsScreen**: Lists active health alerts with pull-to-refresh

---

## Key Talking Points

| Feature | Technology |
|---|---|
| 48h Risk Forecast | XGBoost + Prophet |
| Anomaly Detection | Isolation Forest |
| Explainability | SHAP + Rule-based |
| Geo Clustering | DBSCAN (haversine) |
| Alert Dispatch | SendGrid + Firebase |
| Map Visualization | Mapbox GL heatmap |
| Mobile App | React Native Expo |

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Government | gov@kavach.health | Kavach@2024 |
| Hospital | hospital@kavach.health | Kavach@2024 |
| Citizen | citizen@kavach.health | Kavach@2024 |
