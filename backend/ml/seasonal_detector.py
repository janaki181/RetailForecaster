from datetime import date, datetime
from typing import Dict, List
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import Sale, SeasonalPattern, Product


def month_to_season(month: int) -> str:
    if month in [4, 5, 6]:
        return "summer"
    if month in [7, 8, 9]:
        return "monsoon"
    if month in [10, 11, 12, 1, 2]:
        return "winter"
    return "all-season"


def recompute_seasonal_patterns(db: Session) -> None:
    products = db.query(Product).all()
    for product in products:
        rows = (
            db.query(func.date(Sale.sale_date).label("d"), func.sum(Sale.quantity).label("qty"))
            .filter(Sale.product_id == product.id)
            .group_by(func.date(Sale.sale_date))
            .all()
        )
        if not rows:
            continue
        df = pd.DataFrame(rows, columns=["d", "qty"])
        df["d"] = pd.to_datetime(df["d"])
        baseline = float(df["qty"].mean()) if not df.empty else 0.0
        if baseline <= 0:
            continue

        monthly = df.groupby(df["d"].dt.month)["qty"].mean().to_dict()
        for month in range(1, 13):
            m_avg = float(monthly.get(month, baseline))
            multiplier = m_avg / baseline if baseline > 0 else 1.0
            sp = (
                db.query(SeasonalPattern)
                .filter(SeasonalPattern.product_id == product.id, SeasonalPattern.month == month)
                .first()
            )
            if not sp:
                sp = SeasonalPattern(product_id=product.id, month=month, season_label=month_to_season(month), avg_sales_multiplier=multiplier)
                db.add(sp)
            else:
                sp.season_label = month_to_season(month)
                sp.avg_sales_multiplier = multiplier
                sp.created_at = datetime.utcnow()
    db.commit()


def upcoming_seasonal_forecast(db: Session) -> List[Dict]:
    today = date.today()
    upcoming = [
        {"season": "Festive (Diwali)", "month": 10},
        {"season": "Winter", "month": 11},
        {"season": "Summer", "month": 4},
        {"season": "Monsoon", "month": 7},
    ]
    out = []
    for item in upcoming:
        month = item["month"]
        starts_in_days = (date(today.year if month >= today.month else today.year + 1, month, 1) - today).days
        if starts_in_days < 0:
            starts_in_days = 0
        patterns = db.query(SeasonalPattern).filter(SeasonalPattern.month == month).all()
        if not patterns:
            continue
        top = sorted(patterns, key=lambda p: p.avg_sales_multiplier, reverse=True)[:3]
        products = [db.query(Product).filter(Product.id == p.product_id).first() for p in top]
        names = [p.name for p in products if p]
        spike = int(max((p.avg_sales_multiplier for p in top), default=1.0) * 100 - 100)
        out.append(
            {
                "season": item["season"],
                "starts_in_days": starts_in_days,
                "products_to_stock": names,
                "expected_demand_spike_pct": max(spike, 0),
                "reorder_deadline": str(today if starts_in_days <= 7 else (today.fromordinal(today.toordinal() + max(starts_in_days - 7, 0)))),
            }
        )
    return out
