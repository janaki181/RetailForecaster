# RetailForecaster Backend

FastAPI + PostgreSQL + ML backend for the existing React frontend.

## 1. Setup

1. Create PostgreSQL database:
   - `CREATE DATABASE retailforecaster;`
2. Copy `.env.example` to `.env` and fill values.
3. Install Python dependencies:
   - `pip install -r requirements.txt`
4. Run backend:
   - `uvicorn main:app --reload --port 8000`

On startup it will:
- Create tables
- Seed demo users/products/sales if DB is empty
- Recompute seasonal patterns
- Retrain product demand models
- Schedule retraining every 24 hours

## 2. Default Users

- Admin: `admin@retail.com` / `admin123`
- Manager: `manager@retail.com` / `manager123`
- Sales: `sales@retail.com` / `sales123`
- Analyst: `analyst@retail.com` / `analyst123`

## 3. Run Frontend + Backend Together

Backend (terminal 1):
- `cd backend`
- `uvicorn main:app --reload --port 8000`

Frontend (terminal 2):
- `cd app`
- `npm install`
- `npm run dev`

Frontend runs on `http://localhost:5173` and backend on `http://localhost:8000`.
CORS is enabled for localhost:5173.

## 4. CRUD Endpoints (quick start)

Auth:
- `POST /api/auth/login`

Products:
- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`

Sales:
- `GET /api/sales`
- `POST /api/sales`

Inventory:
- `POST /api/inventory/adjust`
- `GET /api/inventory/logs`

Users (Admin):
- `GET /api/users`
- `POST /api/users/invite`

Settings (Admin):
- `GET /api/settings`
- `PUT /api/settings`

## 5. HuggingFace Token

Set `HF_API_TOKEN` in `.env` from your HuggingFace account for LLM insight endpoints.
If token is missing, insight endpoints return empty/fallback output without crashing.
