from datetime import date, timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Product, InventoryLog, ReorderOrder, DemandForecast, Setting
from schemas import InventoryAdjust
from auth import get_current_user
from ml.reorder_engine import reorder_recommendations
from ml.forecaster import forecast_product

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


# FIXED: proper JSON body schema for create-po (was query params before)
class CreatePORequest(BaseModel):
    product_id: int
    quantity: int


@router.get("/summary")
def inventory_summary(db: Session = Depends(get_db), _=Depends(get_current_user)):
    recs = reorder_recommendations(db)
    total_units = db.query(func.coalesce(func.sum(Product.stock), 0)).scalar() or 0
    avg_daily_all = sum(r["avg_daily_demand"] for r in recs) or 1
    days_of_cover = total_units / avg_daily_all

    settings = {s.key: s.value for s in db.query(Setting).all()}
    max_cap = float(settings.get("max_warehouse_capacity", 50000))
    fill = (total_units / max_cap) * 100 if max_cap else 0

    critical_high = [r for r in recs if r["urgency"] in ["Critical", "High"]]
    return {
        "total_units": int(total_units),
        "days_of_cover": round(float(days_of_cover), 1),
        "reorder_required_skus": len(critical_high),
        "warehouse_fill_pct": round(float(fill), 2),
    }


@router.get("/stock-by-location")
def stock_by_location(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rec_map = {r["product_id"]: r for r in reorder_recommendations(db)}
    products = db.query(Product).all()
    out = []
    for p in products:
        rec = rec_map.get(p.id, {})
        urgency = rec.get("urgency", "Low")
        badge = (
            "Yes" if urgency in ["Critical", "High"]
            else "Soon" if urgency == "Medium"
            else "No"
        )
        days_left = rec.get("days_of_stock_remaining")
        reorder_qty = rec.get("reorder_qty_recommended", 0)
        out.append({
            "item": p.name,
            "location": p.location or "—",
            "on_hand": p.stock,
            "reorder_status": badge,
            "days_of_stock_remaining": days_left,
            "tooltip": (
                f"Stockout in {int(days_left)} days | Reorder {reorder_qty} units"
                if days_left else f"Reorder {reorder_qty} units"
            ),
        })
    return out


@router.get("/alerts")
def inventory_alerts(db: Session = Depends(get_db), _=Depends(get_current_user)):
    recs = reorder_recommendations(db)
    out = []
    for r in recs:
        if r["urgency"] in ["Critical", "High"]:
            days = r.get("days_of_stock_remaining")
            out.append({
                "product": r["name"],
                "alert_type": "Stockout",
                "message": (
                    f"Predicted stockout in {int(days)} days. "
                    f"Reorder {r['reorder_qty_recommended']} units immediately."
                    if days else
                    f"Reorder {r['reorder_qty_recommended']} units urgently."
                ),
                "urgency": r["urgency"],
                "predicted_stockout_date": r["predicted_stockout_date"],
                "recommended_reorder_qty": r["reorder_qty_recommended"],
            })
        elif r["overstocking_risk"]:
            excess = max(r["current_stock"] - int(r["predicted_demand_60d"]), 0)
            out.append({
                "product": r["name"],
                "alert_type": "Overstock",
                "message": f"60-day forecast shows {excess} excess units. Consider a promotion.",
                "urgency": "Low",
                "overstock_units": excess,
            })
    return out[:20]


@router.post("/create-po")
def create_po(
    payload: CreatePORequest,        # FIXED: JSON body not query params
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    p = db.query(Product).filter(Product.id == payload.product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")

    # FIXED: pull real ML-predicted demand before saving the PO record
    pred30 = (
        db.query(func.coalesce(func.sum(DemandForecast.predicted_qty), 0.0))
        .filter(
            DemandForecast.product_id == p.id,
            DemandForecast.forecast_date >= date.today(),
            DemandForecast.forecast_date <= date.today() + timedelta(days=30),
        )
        .scalar()
    ) or 0.0

    conf = (
        db.query(func.avg(DemandForecast.confidence_score))
        .filter(DemandForecast.product_id == p.id)
        .scalar()
    )

    p.stock += payload.quantity
    po = ReorderOrder(
        product_id=p.id,
        recommended_qty=payload.quantity,
        current_stock=p.stock,
        predicted_demand_30d=float(pred30),      # FIXED: real ML value
        confidence=float(conf) if conf else None,
        status="Pending",
    )
    db.add(po)
    db.add(InventoryLog(product_id=p.id, change_qty=payload.quantity, reason="Purchase Order"))
    db.commit()
    db.refresh(po)
    forecast_product(db, p.id, horizon=7)

    return {"po_id": po.id, "product": p.name, "quantity": payload.quantity, "status": po.status}


@router.get("/logs")
def inventory_logs(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = (
        db.query(InventoryLog, Product)
        .join(Product, Product.id == InventoryLog.product_id)
        .order_by(InventoryLog.timestamp.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "product_name": p.name,
            "change_qty": log.change_qty,
            "reason": log.reason,
            "timestamp": log.timestamp,
        }
        for log, p in rows
    ]


@router.post("/adjust")
def adjust_inventory(
    payload: InventoryAdjust,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    p = db.query(Product).filter(Product.id == payload.product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    p.stock += payload.change_qty
    db.add(InventoryLog(product_id=p.id, change_qty=payload.change_qty, reason=payload.reason))
    db.commit()
    forecast_product(db, p.id, horizon=7)
    return {"product_id": p.id, "new_stock": p.stock}
