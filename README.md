# Kavach — AI Predictive Disease Outbreak Dashboard

> 48-hour disease outbreak forecasting using hospital admissions, water quality, weather signals, and citizen reports.

---

## 🗂️ Project Structure

```
/backend        Node.js + Express + Prisma (REST API)
/ml-service     Python FastAPI (XGBoost + Prophet + SHAP)
/frontend       Next.js + Tailwind + Mapbox (Gov/Hospital Dashboard)
/mobile         React Native Expo (Citizen App)
```

---

## ⚡ Quick Start (Docker)

```bash
# 1. Clone and enter project
cd Kavach

# 2. Copy env files
cp backend/.env.example backend/.env

# 3. Start all services
docker-compose up --build

# 4. Run DB migrations + seed demo data
docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npm run db:seed

# 5. Train ML models
docker-compose exec ml-service python -m app.models.train
```

Services:
- Backend API: http://localhost:5000
- ML Service:  http://localhost:8000
- Frontend:    http://localhost:3000 (run separately)

---

## 🖥️ Frontend Setup

```bash
cd frontend
npm install
# Add your Mapbox token to .env.local:
echo "NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here" > .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" >> .env.local
npm run dev
```

Open http://localhost:3000

---

## 📱 Mobile Setup

```bash
cd mobile
npm install
npx expo start
```

Scan QR code with Expo Go app.

---

## 🔑 Demo Credentials

| Role     | Email                      | Password     |
|----------|----------------------------|--------------|
| GOV      | gov@kavach.health          | Kavach@2024  |
| HOSPITAL | hospital@kavach.health     | Kavach@2024  |
| CITIZEN  | citizen@kavach.health      | Kavach@2024  |

---

## 🤖 ML Model Training

```bash
cd ml-service
pip install -r requirements.txt
python -m app.models.train
# Saves models to app/models/saved/
```

The system has a **rule-based fallback** — it works even without trained models.

---

## 🌐 API Endpoints

| Method | Endpoint                    | Auth        | Description                    |
|--------|-----------------------------|-------------|--------------------------------|
| POST   | /api/auth/register          | —           | Register user                  |
| POST   | /api/auth/login             | —           | Login → JWT                    |
| POST   | /api/hospital               | HOSPITAL    | Ingest admission (syndromeType)|
| GET    | /api/hospital/:wardId/summary | GOV/HOSP  | Syndrome breakdown             |
| POST   | /api/water                  | GOV/HOSP    | Ingest water quality report    |
| POST   | /api/citizen                | Any         | Submit symptom report          |
| POST   | /api/risk/predict           | GOV/HOSP    | Trigger 48h ML prediction      |
| GET    | /api/risk/heatmap           | Any         | All wards + risk scores (map)  |
| GET    | /api/risk/:wardId           | Any         | Latest prediction + AI insights|
| GET    | /api/alerts                 | Any         | List alerts                    |

---

## 🚀 Deployment

### Backend → Railway
```bash
railway login
railway up --service backend
```

### ML Service → Railway
```bash
railway up --service ml-service
```

### Frontend → Vercel
```bash
cd frontend
vercel --prod
```

### Database → Supabase
1. Create project at supabase.com
2. Copy connection string to `DATABASE_URL` in backend `.env`
3. Run `npx prisma migrate deploy`

---

## 🎯 Demo Flow (Hackathon)

1. Open dashboard → Ward 1 (Dharavi) shows **HIGH/CRITICAL** risk
2. Click **"Run 48h Prediction"** → AI Insight Box populates:
   - 🔵 Chlorine dropped 79% vs 7-day avg
   - 🔴 Diarrhea cases ↑ 3.2× in last 48h
   - 🌧️ Rainfall spike of 52mm yesterday
3. Alert auto-triggers → email + push notification sent
4. Switch to mobile app → citizen sees alert + AI explanation
5. Citizen submits symptom report → feeds back into next prediction

---

## 🏗️ Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | Node.js, Express, Prisma, PostgreSQL, Zod, JWT  |
| ML       | FastAPI, XGBoost, Prophet, IsolationForest, SHAP|
| Frontend | Next.js 14, Tailwind CSS, Mapbox GL, Recharts   |
| Mobile   | React Native Expo, React Navigation             |
| Alerts   | SendGrid (email), Firebase (push)               |
| Deploy   | Railway (backend+ML), Vercel (frontend), Supabase (DB) |
