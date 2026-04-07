import os
from contextlib import asynccontextmanager
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, SessionLocal
from ml.forecaster import retrain_all_models
from ml.seasonal_detector import recompute_seasonal_patterns
from seed_data import run_seed
from routers import (
    auth_router as auth,
    dashboard,
    products,
    sales,
    analytics,
    inventory,
    users,
    settings,
    forecast,
    reports,
)

load_dotenv()

scheduler = BackgroundScheduler()


def retrain_job():
    db = SessionLocal()
    try:
        recompute_seasonal_patterns(db)
        result = retrain_all_models(db, horizon=int(os.getenv("FORECAST_HORIZON_DAYS", "7")))
        print(f"Models retrained at {datetime.utcnow().isoformat()}, confidence: {result.get('avg_confidence')}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_seed()
    retrain_job()

    scheduler.add_job(retrain_job, "interval", hours=24, id="retrain_models", replace_existing=True)
    scheduler.start()

    yield

    scheduler.shutdown(wait=False)


app = FastAPI(title="RetailForecaster API", version="1.0.0", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(analytics.router)
app.include_router(inventory.router)
app.include_router(users.router)
app.include_router(settings.router)
app.include_router(forecast.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"service": "RetailForecaster backend", "status": "ok"}