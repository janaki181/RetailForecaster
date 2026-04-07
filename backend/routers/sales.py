from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Sale, Product, InventoryLog, Setting
from schemas import SaleCreate, SaleStatusUpdate
from auth import get_current_user
from ml.forecaster import forecast_product
from ml.llm_insights import generate_channel_insights

router = APIRouter(prefix="/api/sales", tags=["sales"])


def _is_fulfilled_status(status: str) -> bool:
    return (status or "").strip().lower() in {"shipped", "delivered"}


def _has_sale_deduction_log(db: Session, sale_id: int) -> bool:
    return (
        db.query(InventoryLog.id)
        .filter(InventoryLog.reason == f"Sale #{sale_id}")
        .first()
        is not None
    )


@router.get("/summary")
def sales_summary(db: Session = Depends(get_db), _=Depends(get_current_user)):
    latest_sale_dt = db.query(func.max(func.date(Sale.sale_date))).scalar()
    today = latest_sale_dt or date.today()
    today_revenue = (
        db.query(func.coalesce(func.sum(Sale.revenue), 0.0)).filter(func.date(Sale.sale_date) == today).scalar() or 0.0
    )
    orders_today = db.query(func.count(Sale.id)).filter(func.date(Sale.sale_date) == today).scalar() or 0
    avg_order_value = (today_revenue / orders_today) if orders_today else 0.0
    settings = {s.key: s.value for s in db.query(Setting).all()}
    sessions_today = float(settings.get("sessions_today", orders_today * 3 if orders_today else 1))
    conversion = (orders_today / sessions_today) * 100 if sessions_today else 0.0
    return {
        "today_revenue": round(float(today_revenue), 2),
        "orders_today": orders_today,
        "avg_order_value": round(float(avg_order_value), 2),
        "conversion_rate": round(float(conversion), 2),
    }


@router.get("/recent")
def recent_sales(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = (
        db.query(Sale, Product)
        .join(Product, Product.id == Sale.product_id)
        .order_by(Sale.sale_date.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "sale_id": sale.id,
            "order_id": f"ORD-{sale.id:04d}",
            "customer_name": sale.customer_name,
            "channel": sale.channel,
            "value": sale.revenue,
            "status": sale.status,
            "product": product.name,
            "sale_date": sale.sale_date,
        }
        for sale, product in rows
    ]


@router.get("")
def list_sales(start_date: str = None, end_date: str = None, channel: str = None, category: str = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(Sale, Product).join(Product, Product.id == Sale.product_id)
    if start_date:
        q = q.filter(func.date(Sale.sale_date) >= datetime.fromisoformat(start_date).date())
    if end_date:
        q = q.filter(func.date(Sale.sale_date) <= datetime.fromisoformat(end_date).date())
    if channel:
        q = q.filter(Sale.channel == channel)
    if category:
        q = q.filter(Product.category == category)
    rows = q.order_by(Sale.sale_date.desc()).all()
    return [
        {
            "id": sale.id,
            "product_id": sale.product_id,
            "product": product.name,
            "customer_name": sale.customer_name,
            "channel": sale.channel,
            "quantity": sale.quantity,
            "revenue": sale.revenue,
            "status": sale.status,
            "sale_date": sale.sale_date,
        }
        for sale, product in rows
    ]


@router.post("")
def create_sale(payload: SaleCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    p = db.query(Product).filter(Product.id == payload.product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")
    should_deduct = _is_fulfilled_status(payload.status)
    if should_deduct and p.stock < payload.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    revenue = payload.quantity * p.price
    s = Sale(
        product_id=payload.product_id,
        customer_name=payload.customer_name,
        channel=payload.channel,
        quantity=payload.quantity,
        revenue=revenue,
        status=payload.status,
    )
    db.add(s)
    db.commit()
    db.refresh(s)

    if should_deduct and not _has_sale_deduction_log(db, s.id):
        p.stock -= payload.quantity
        db.add(InventoryLog(product_id=p.id, change_qty=-payload.quantity, reason=f"Sale #{s.id}"))
        db.commit()

    forecast_product(db, p.id, horizon=7)

    return {"id": s.id, "revenue": s.revenue, "stock_after": p.stock}


@router.put("/{sale_id}/status")
def update_sale_status(sale_id: int, payload: SaleStatusUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    product = db.query(Product).filter(Product.id == sale.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    old_status = sale.status
    sale.status = payload.status

    if _is_fulfilled_status(payload.status) and not _has_sale_deduction_log(db, sale.id):
        if product.stock < sale.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock to mark as shipped/delivered")
        product.stock -= sale.quantity
        db.add(InventoryLog(product_id=product.id, change_qty=-sale.quantity, reason=f"Sale #{sale.id}"))

    db.commit()
    forecast_product(db, product.id, horizon=7)

    return {
        "sale_id": sale.id,
        "old_status": old_status,
        "new_status": sale.status,
        "stock_after": product.stock,
    }


@router.get("/channel-mix")
def channel_mix(db: Session = Depends(get_db), _=Depends(get_current_user)):
    month_start = date.today().replace(day=1)
    rows = (
        db.query(Sale.channel, func.coalesce(func.sum(Sale.revenue), 0.0).label("rev"))
        .filter(func.date(Sale.sale_date) >= month_start)
        .group_by(Sale.channel)
        .all()
    )
    total = sum(float(r.rev) for r in rows) or 1.0
    data = {r.channel: round((float(r.rev) / total) * 100, 2) for r in rows}
    notes = generate_channel_insights(str(data))
    return {"breakdown_pct": data, "insights": notes}
