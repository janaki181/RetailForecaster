from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Sale, Product, DemandForecast
from auth import get_current_user
from ml.reorder_engine import reorder_recommendations

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _pct(cur: float, prev: float):
    if prev == 0:
        return None
    return ((cur - prev) / prev) * 100


@router.get("/summary")
def summary(db: Session = Depends(get_db), _=Depends(get_current_user)):
    today = date.today()
    yday = today - timedelta(days=1)
    this_month = today.replace(day=1)
    prev_month_end = this_month - timedelta(days=1)
    prev_month_start = prev_month_end.replace(day=1)

    tr = db.query(func.coalesce(func.sum(Sale.revenue), 0.0)).filter(func.date(Sale.sale_date) == today).scalar() or 0.0
    yr = db.query(func.coalesce(func.sum(Sale.revenue), 0.0)).filter(func.date(Sale.sale_date) == yday).scalar() or 0.0
    tu = db.query(func.coalesce(func.sum(Sale.quantity), 0)).filter(func.date(Sale.sale_date) == today).scalar() or 0
    yu = db.query(func.coalesce(func.sum(Sale.quantity), 0)).filter(func.date(Sale.sale_date) == yday).scalar() or 0
    low = db.query(func.count(Product.id)).filter(Product.stock < Product.min_stock).scalar() or 0
    mr = db.query(func.coalesce(func.sum(Sale.revenue), 0.0)).filter(func.date(Sale.sale_date) >= this_month).scalar() or 0.0
    pmr = db.query(func.coalesce(func.sum(Sale.revenue), 0.0)).filter(func.date(Sale.sale_date) >= prev_month_start, func.date(Sale.sale_date) <= prev_month_end).scalar() or 0.0

    return {
        "today_revenue": float(tr),
        "today_revenue_change_pct": _pct(float(tr), float(yr)),
        "units_sold_today": int(tu),
        "units_sold_change_pct": _pct(float(tu), float(yu)),
        "low_stock_items": int(low),
        "monthly_revenue": float(mr),
        "monthly_revenue_change_pct": _pct(float(mr), float(pmr)),
    }


@router.get("/sales-trend")
def sales_trend(db: Session = Depends(get_db), _=Depends(get_current_user)):
    today = date.today()
    start = today - timedelta(days=29)
    labels = [start + timedelta(days=i) for i in range(30)]
    actual = []
    forecast = []
    for d in labels:
        ar = db.query(func.coalesce(func.sum(Sale.revenue), 0.0)).filter(func.date(Sale.sale_date) == d).scalar() or 0.0
        fr = (
            db.query(func.coalesce(func.sum(DemandForecast.predicted_qty * Product.price), 0.0))
            .join(Product, Product.id == DemandForecast.product_id)
            .filter(DemandForecast.forecast_date == d)
            .scalar()
            or 0.0
        )
        actual.append(float(ar))
        forecast.append(float(fr))
    return {"labels": [str(d) for d in labels], "actual_values": actual, "forecast_values": forecast}


@router.get("/category-performance")
def category_performance(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = (
        db.query(Product.category, func.coalesce(func.sum(Sale.revenue), 0.0).label("rev"))
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Product.category)
        .all()
    )
    total = sum(float(r.rev) for r in rows) or 1.0
    return [{"category": r.category, "revenue_pct": round((float(r.rev) / total) * 100, 2)} for r in rows]


@router.get("/demand-alerts")
def demand_alerts(db: Session = Depends(get_db), _=Depends(get_current_user)):
    recs = reorder_recommendations(db)
    urgent = [r for r in recs if r["urgency"] in ["Critical", "High", "Medium"]]
    urgent.sort(key=lambda x: {"Critical": 0, "High": 1, "Medium": 2}.get(x["urgency"], 9))
    out = []
    for r in urgent[:3]:
        if r["days_of_stock_remaining"] is not None:
            msg = f"Stockout predicted in {int(r['days_of_stock_remaining'])} days, reorder {r['reorder_qty_recommended']} units"
        else:
            msg = "Demand signal unavailable due to insufficient data"
        out.append({"product": r["name"], "alert": msg, "urgency": r["urgency"]})
    return out
