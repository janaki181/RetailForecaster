from datetime import date, timedelta
from typing import Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import Product, Sale, DemandForecast, SeasonalPattern


def _avg_daily_demand_30d(db: Session, product_id: int) -> float:
    qty = (
        db.query(func.coalesce(func.sum(Sale.quantity), 0))
        .filter(
            Sale.product_id == product_id,
            Sale.sale_date >= date.today() - timedelta(days=30),
        )
        .scalar()
    )
    return float(qty) / 30.0


def _predicted_sum(db: Session, product_id: int, days: int) -> float:
    end = date.today() + timedelta(days=days)
    total = (
        db.query(func.coalesce(func.sum(DemandForecast.predicted_qty), 0.0))
        .filter(
            DemandForecast.product_id == product_id,
            DemandForecast.forecast_date >= date.today(),
            DemandForecast.forecast_date <= end,
        )
        .scalar()
    )
    return float(total or 0.0)


def reorder_recommendations(db: Session, safety_buffer_days: int = 7) -> List[Dict]:
    out = []
    products = db.query(Product).all()

    for p in products:
        avg_daily = _avg_daily_demand_30d(db, p.id)
        pred30 = _predicted_sum(db, p.id, 30)
        pred60 = _predicted_sum(db, p.id, 60)

        days_remaining = (p.stock / avg_daily) if avg_daily > 0 else 9999
        stockout_date = (
            date.today() + timedelta(days=int(days_remaining))
            if days_remaining < 9999 else None
        )

        # FIXED: use the UPCOMING month's multiplier, not the highest-ever.
        # A winter jacket should not show a seasonal spike alert in June.
        next_month = (date.today().month % 12) + 1
        upcoming_sp = (
            db.query(SeasonalPattern)
            .filter(
                SeasonalPattern.product_id == p.id,
                SeasonalPattern.month == next_month,
            )
            .first()
        )
        season_multiplier = (
            float(upcoming_sp.avg_sales_multiplier)
            if upcoming_sp and upcoming_sp.avg_sales_multiplier > 1.0
            else 1.0
        )

        reorder_qty = max(
            int((pred30 - p.stock + (avg_daily * safety_buffer_days)) * season_multiplier),
            0,
        )

        if days_remaining <= 7:
            urgency = "Critical"
        elif days_remaining <= 15:
            urgency = "High"
        elif days_remaining <= 30:
            urgency = "Medium"
        else:
            urgency = "Low"

        overstocking = bool(pred60 > 0 and p.stock > pred60 * 1.5)

        season_note = None
        if season_multiplier > 1.0:
            month_name = date(2000, next_month, 1).strftime("%B")
            season_note = f"{month_name} seasonal demand spike expected (×{season_multiplier:.1f})"

        out.append({
            "product_id": p.id,
            "sku": p.sku,
            "name": p.name,
            "category": p.category,
            "current_stock": p.stock,
            "avg_daily_demand": round(avg_daily, 2),
            "predicted_demand_30d": round(pred30, 2),
            "predicted_demand_60d": round(pred60, 2),
            "days_of_stock_remaining": round(days_remaining, 1) if days_remaining < 9999 else None,
            "predicted_stockout_date": str(stockout_date) if stockout_date else None,
            "reorder_qty_recommended": reorder_qty,
            "safety_buffer_included": safety_buffer_days,
            "seasonal_adjustment": season_multiplier > 1.0,
            "season_note": season_note,
            "confidence_score": None,
            "urgency": urgency,
            "overstocking_risk": overstocking,
        })

    return out
