from datetime import date, datetime, timedelta
from typing import Dict
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import Sale, SeasonalPattern, DemandForecast, Product
from ml.feature_engineering import build_features, is_festive_period
from ml.model_store import save_model

FEATURES = [
    "day_of_week", "day_of_month", "month", "is_weekend", "is_festive_period",
    "lag_7", "lag_14", "lag_30",
    "rolling_mean_7", "rolling_mean_14", "rolling_mean_30",
    "season_multiplier",
]


def _season_multiplier(db: Session, product_id: int, month: int) -> float:
    sp = (
        db.query(SeasonalPattern)
        .filter(SeasonalPattern.product_id == product_id, SeasonalPattern.month == month)
        .first()
    )
    return float(sp.avg_sales_multiplier) if sp else 1.0


def _daily_sales_df(db: Session, product_id: int, lookback_days: int = 180) -> pd.DataFrame:
    start = datetime.utcnow() - timedelta(days=lookback_days)
    rows = (
        db.query(
            func.date(Sale.sale_date).label("sale_date"),
            func.sum(Sale.quantity).label("qty"),
        )
        .filter(Sale.product_id == product_id, Sale.sale_date >= start)
        .group_by(func.date(Sale.sale_date))
        .order_by(func.date(Sale.sale_date))
        .all()
    )
    if not rows:
        return pd.DataFrame(columns=["sale_date", "qty"])
    return pd.DataFrame(rows, columns=["sale_date", "qty"])


def forecast_product(db: Session, product_id: int, horizon: int = 7) -> Dict:
    empty = {
        "product_id": product_id,
        "model": None,
        "confidence": None,
        "predictions": [],
        "feature_importances": {},
    }

    df = _daily_sales_df(db, product_id)
    if df.empty:
        return empty

    feat = build_features(df)
    if feat.empty or len(feat) < 2:
        return empty

    feat["season_multiplier"] = feat["month"].apply(
        lambda m: _season_multiplier(db, product_id, int(m))
    )

    X = feat[FEATURES]
    y = feat["qty"]

    if len(X) < 30:
        model = LinearRegression()
        model_type = "LinearRegression"
    else:
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model_type = "RandomForestRegressor"

    model.fit(X, y)
    train_pred = model.predict(X)

    # FIXED: clamp R² — raw score can be negative when model underperforms mean baseline
    raw_r2 = float(r2_score(y, train_pred)) if len(y) > 1 else 0.0
    confidence = max(0.0, raw_r2)

    history = list(feat["qty"].astype(float).values)
    last_date = pd.to_datetime(feat["sale_day"].max()).date()

    preds = []
    for i in range(1, horizon + 1):
        d = last_date + timedelta(days=i)
        row = pd.DataFrame([{
            "day_of_week": d.weekday(),
            "day_of_month": d.day,
            "month": d.month,
            "is_weekend": 1 if d.weekday() in [5, 6] else 0,
            "is_festive_period": is_festive_period(d),
            "lag_7": history[-7] if len(history) >= 7 else 0.0,
            "lag_14": history[-14] if len(history) >= 14 else 0.0,
            "lag_30": history[-30] if len(history) >= 30 else 0.0,
            "rolling_mean_7": float(np.mean(history[-7:])) if history else 0.0,
            "rolling_mean_14": float(np.mean(history[-14:])) if history else 0.0,
            "rolling_mean_30": float(np.mean(history[-30:])) if history else 0.0,
            "season_multiplier": _season_multiplier(db, product_id, d.month),
        }])
        q = max(float(model.predict(row)[0]), 0.0)
        history.append(q)
        preds.append({"date": d, "predicted_qty": q})

    # Upsert — delete stale forecasts then insert fresh ones
    db.query(DemandForecast).filter(DemandForecast.product_id == product_id).delete()
    for p in preds:
        db.add(DemandForecast(
            product_id=product_id,
            forecast_date=p["date"],
            predicted_qty=p["predicted_qty"],
            confidence_score=confidence,
            model_type=model_type,
        ))
    db.commit()

    fi = {}
    if hasattr(model, "feature_importances_"):
        fi = {FEATURES[i]: float(v) for i, v in enumerate(model.feature_importances_)}
    elif hasattr(model, "coef_"):
        fi = {FEATURES[i]: float(v) for i, v in enumerate(model.coef_)}

    # FIXED: save the actual sklearn model object (not just metadata dict)
    save_model(product_id, {
        "model": model,
        "model_type": model_type,
        "confidence": confidence,
        "feature_importances": fi,
    })

    return {
        "product_id": product_id,
        "model": model_type,
        "confidence": confidence,
        "predictions": [
            {"date": str(p["date"]), "predicted_qty": round(p["predicted_qty"], 2)}
            for p in preds
        ],
        "feature_importances": fi,
    }


def retrain_all_models(db: Session, horizon: int = 7) -> Dict:
    products = db.query(Product).all()
    scores = []
    for p in products:
        result = forecast_product(db, p.id, horizon=horizon)
        if result["confidence"] is not None:
            scores.append(result["confidence"])
    avg_score = float(np.mean(scores)) if scores else None
    return {
        "products_retrained": len(products),
        "avg_confidence": avg_score,
        "timestamp": datetime.utcnow().isoformat(),
    }
