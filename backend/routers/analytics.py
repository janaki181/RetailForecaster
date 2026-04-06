from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Sale, DemandForecast, Product, SeasonalPattern, Setting
from auth import get_current_user
from ml.llm_insights import generate_performance_highlights, generate_recommended_actions
from ml.reorder_engine import reorder_recommendations
from ml.seasonal_detector import upcoming_seasonal_forecast

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), _=Depends(get_current_user)):
    settings = {s.key: s.value for s in db.query(Setting).all()}
    est_vis = float(settings.get("estimated_visitors_per_order", 20))

    last7 = date.today() - timedelta(days=7)
    orders7 = db.query(func.count(Sale.id)).filter(func.date(Sale.sale_date) >= last7).scalar() or 0
    sessions_7d = int(orders7 * est_vis)

    # FIXED: bounce rate = single-item orders / total orders.
    # Old formula (100 - max_channel_share) was meaningless.
    total_orders = db.query(func.count(Sale.id)).scalar() or 1
    single_item = db.query(func.count(Sale.id)).filter(Sale.quantity == 1).scalar() or 0
    bounce_rate = round((single_item / total_orders) * 100, 2)

    # FIXED: clamp avg confidence to [0, 100] — raw R² can be negative
    avg_conf = db.query(func.avg(DemandForecast.confidence_score)).scalar()
    conf_pct = round(max(0.0, float(avg_conf)) * 100, 2) if avg_conf is not None else None

    total_customers = db.query(func.count(func.distinct(Sale.customer_name))).scalar() or 0
    returning = (
        db.query(func.count())
        .select_from(
            db.query(Sale.customer_name)
            .group_by(Sale.customer_name)
            .having(func.count(Sale.id) > 1)
            .subquery()
        )
        .scalar()
    ) or 0
    returning_pct = round((returning / total_customers) * 100, 2) if total_customers else 0.0

    return {
        "sessions_7d": sessions_7d,
        "bounce_rate_pct": bounce_rate,
        "forecast_confidence_pct": conf_pct,
        "returning_users_pct": returning_pct,
    }


@router.get("/performance-highlights")
def performance_highlights(db: Session = Depends(get_db), _=Depends(get_current_user)):
    cat = (
        db.query(Product.category, func.coalesce(func.sum(Sale.revenue), 0.0))
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Product.category)
        .all()
    )
    chan = db.query(Sale.channel, func.coalesce(func.sum(Sale.revenue), 0.0)).group_by(Sale.channel).all()
    conf = db.query(func.avg(DemandForecast.confidence_score)).scalar()
    patterns = db.query(func.count(SeasonalPattern.id)).scalar() or 0
    summary_text = (
        f"Category revenue={cat}; Channel revenue={chan}; "
        f"AvgForecastConfidence={conf}; SeasonalPatterns={patterns}"
    )
    return {"highlights": generate_performance_highlights(summary_text)}


@router.get("/recommended-actions")
def recommended_actions(db: Session = Depends(get_db), _=Depends(get_current_user)):
    recs = reorder_recommendations(db)
    return {"actions": generate_recommended_actions(str(recs[:15]))}


@router.get("/seasonal-forecast")
def seasonal_forecast(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return upcoming_seasonal_forecast(db)
