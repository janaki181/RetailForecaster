from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Product, DemandForecast, Sale
from auth import get_current_user
from ml.forecaster import forecast_product, retrain_all_models
from ml.reorder_engine import reorder_recommendations

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


# Named routes first — /{product_id} is last to avoid routing conflicts

@router.get("/all")
def forecast_all(db: Session = Depends(get_db), _=Depends(get_current_user)):
    # FIXED: reads from DemandForecast table if data exists for today.
    # Old code called forecast_product() for every product on every request
    # which retrained 20 ML models — taking 30-60 seconds per API call.
    products = db.query(Product).all()
    out = []
    for p in products:
        existing_count = (
            db.query(DemandForecast)
            .filter(
                DemandForecast.product_id == p.id,
                DemandForecast.forecast_date >= date.today(),
            )
            .count()
        )
        if existing_count > 0:
            rows = (
                db.query(DemandForecast)
                .filter(
                    DemandForecast.product_id == p.id,
                    DemandForecast.forecast_date >= date.today(),
                )
                .order_by(DemandForecast.forecast_date.asc())
                .limit(7)
                .all()
            )
            conf = max(0.0, float(rows[0].confidence_score)) if rows and rows[0].confidence_score else None
            out.append({
                "product_id": p.id,
                "product_name": p.name,
                "model": rows[0].model_type if rows else None,
                "confidence": conf,
                "predictions": [
                    {"date": str(r.forecast_date), "predicted_qty": round(r.predicted_qty, 2)}
                    for r in rows
                ],
            })
        else:
            # Only train when no cached data exists
            result = forecast_product(db, p.id, horizon=7)
            result["product_name"] = p.name
            out.append(result)
    return out


@router.get("/chart-data")
def chart_data(db: Session = Depends(get_db), _=Depends(get_current_user)):
    end = db.query(func.max(func.date(Sale.sale_date))).scalar() or date.today()
    start = end - timedelta(days=29)

    top = (
        db.query(
            Product.id,
            Product.name,
            func.coalesce(func.sum(Sale.quantity), 0.0).label("qty"),
        )
        .join(Sale, Sale.product_id == Product.id)
        .filter(func.date(Sale.sale_date) >= start, func.date(Sale.sale_date) <= end)
        .group_by(Product.id, Product.name)
        .order_by(func.coalesce(func.sum(Sale.quantity), 0.0).desc())
        .limit(5)
        .all()
    )

    labels = [start + timedelta(days=i) for i in range(30)]
    datasets = []

    for t in top:
        actual_rows = (
            db.query(func.date(Sale.sale_date).label("d"), func.coalesce(func.sum(Sale.quantity), 0.0).label("qty"))
            .filter(
                Sale.product_id == t.id,
                func.date(Sale.sale_date) >= start,
                func.date(Sale.sale_date) <= end,
            )
            .group_by(func.date(Sale.sale_date))
            .order_by(func.date(Sale.sale_date).asc())
            .all()
        )

        actual_map = {r.d: float(r.qty) for r in actual_rows}
        actual_values = [round(actual_map.get(d, 0.0), 2) for d in labels]

        # Simple rolling baseline for comparison over historical window.
        predicted_values = []
        history = []
        for v in actual_values:
            if history:
                window = history[-7:]
                predicted_values.append(round(sum(window) / len(window), 2))
            else:
                predicted_values.append(round(v, 2))
            history.append(v)

        datasets.append(
            {
                "product": t.name,
                "actual_values": actual_values,
                "predicted_values": predicted_values,
            }
        )

    return {"labels": [str(d) for d in labels], "datasets": datasets}


@router.get("/demand-summary")
def demand_summary(db: Session = Depends(get_db), _=Depends(get_current_user)):
    recs = reorder_recommendations(db)
    out = []
    for r in recs:
        trend_pct = None
        if r["predicted_demand_30d"] and r["avg_daily_demand"]:
            baseline = r["avg_daily_demand"] * 30
            if baseline > 0:
                trend_pct = ((r["predicted_demand_30d"] - baseline) / baseline) * 100

        action = "Monitor"
        if r["urgency"] in ["Critical", "High"]:
            action = "Urgent Restock"
        elif r["predicted_demand_30d"] > r["current_stock"]:
            action = "Restock"
        if r["overstocking_risk"]:
            action = "Overstock Risk"
            if trend_pct is not None and trend_pct < -5:
                action = "Markdown"

        out.append({
            "product": r["name"],
            "current_stock": r["current_stock"],
            "forecast_30d": round(r["predicted_demand_30d"], 1),
            "trend_pct": round(float(trend_pct), 2) if trend_pct is not None else None,
            "action": action,
            "season_note": r["season_note"],
            "urgency": r["urgency"],
        })
    return out


@router.get("/reorder-recommendations")
def reorder(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return reorder_recommendations(db)


@router.post("/retrain")
def retrain(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return retrain_all_models(db, horizon=7)


# Parameterized route LAST — prevents /all, /chart-data etc. being matched as product IDs
@router.get("/{product_id}")
def forecast_single(
    product_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return forecast_product(db, product_id, horizon=7)
