from datetime import datetime, date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import func
from sqlalchemy.orm import Session
from lxml import etree

from database import get_db
from models import Product, Sale, DemandForecast, SeasonalPattern
from schemas import ProductCreate, ProductUpdate, ProductOut
from auth import get_current_user
from ml.forecaster import forecast_product
from ml.llm_insights import generate_product_notes

router = APIRouter(prefix="/api/products", tags=["products"])


def _next_sku(db: Session) -> str:
    count = db.query(func.count(Product.id)).scalar() or 0
    return f"SKU-{count + 1:04d}"


# ─── FIXED: all named/static routes BEFORE /{product_id} ──────────────────────
# FastAPI matches routes top-to-bottom. If /{product_id} came first,
# "/summary" would be swallowed as a product_id lookup and return a 422 error.

@router.get("/summary")
def products_summary(db: Session = Depends(get_db), _=Depends(get_current_user)):
    active_skus = db.query(func.count(Product.id)).scalar() or 0
    low_stock_items = (
        db.query(func.count(Product.id))
        .filter(Product.stock < Product.min_stock)
        .scalar() or 0
    )
    avg_margin_pct = (
        db.query(
            func.avg(
                ((Product.price - Product.cost_price) / func.nullif(Product.price, 0)) * 100
            )
        ).scalar() or 0.0
    )
    month_start = date.today().replace(day=1)
    top_cat = (
        db.query(Product.category, func.sum(Sale.revenue).label("rev"))
        .join(Sale, Sale.product_id == Product.id)
        .filter(func.date(Sale.sale_date) >= month_start)
        .group_by(Product.category)
        .order_by(func.sum(Sale.revenue).desc())
        .first()
    )
    return {
        "active_skus": active_skus,
        "top_category": top_cat[0] if top_cat else None,
        "low_stock_items": low_stock_items,
        "avg_margin_pct": round(float(avg_margin_pct), 2),
    }


@router.get("/top-performing")
def top_performing(db: Session = Depends(get_db), _=Depends(get_current_user)):
    end = datetime.utcnow()
    last7 = end - timedelta(days=7)
    prev7 = end - timedelta(days=14)

    products = db.query(Product).all()
    out = []
    for p in products:
        last_sum = (
            db.query(func.coalesce(func.sum(Sale.quantity), 0))
            .filter(Sale.product_id == p.id, Sale.sale_date >= last7, Sale.sale_date < end)
            .scalar()
        ) or 0
        prev_sum = (
            db.query(func.coalesce(func.sum(Sale.quantity), 0))
            .filter(Sale.product_id == p.id, Sale.sale_date >= prev7, Sale.sale_date < last7)
            .scalar()
        ) or 0
        trend = None if prev_sum == 0 else ((last_sum - prev_sum) / prev_sum) * 100

        f7 = (
            db.query(func.coalesce(func.sum(DemandForecast.predicted_qty), 0.0))
            .filter(
                DemandForecast.product_id == p.id,
                DemandForecast.forecast_date >= date.today(),
                DemandForecast.forecast_date <= date.today() + timedelta(days=7),
            )
            .scalar()
        ) or 0.0

        demand_status = "Stable"
        if trend is not None and trend > 5:
            demand_status = "Rising"
        elif trend is not None and trend < -5:
            demand_status = "Falling"

        seasonal = (
            db.query(SeasonalPattern)
            .filter(
                SeasonalPattern.product_id == p.id,
                SeasonalPattern.month == date.today().month,
            )
            .first()
        )
        season_alert = (
            "Festive spike expected"
            if seasonal and seasonal.avg_sales_multiplier > 1.3
            else None
        )

        out.append({
            "sku": p.sku,
            "name": p.name,
            "category": p.category,
            "stock": p.stock,
            "trend_7d_pct": round(float(trend), 2) if trend is not None else None,
            "forecast_next_7d": round(float(f7), 2),
            "demand_status": demand_status,
            "season_alert": season_alert,
        })

    out.sort(key=lambda x: x["forecast_next_7d"], reverse=True)
    return out[:20]


@router.get("/notes")
def product_notes(db: Session = Depends(get_db), _=Depends(get_current_user)):
    top = top_performing(db, _)
    low_stock = db.query(Product).filter(Product.stock < Product.min_stock).count()
    summary = f"Top products: {top[:5]}. Low stock count: {low_stock}."
    notes = generate_product_notes(summary)
    return {"notes": notes}


@router.post("/import-xml")
def import_xml(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    tree = etree.parse(file.file)
    root = tree.getroot()
    inserted = 0
    for node in root.findall("product"):
        payload = {
            "name": node.findtext("name", default="Unnamed"),
            "category": node.findtext("category", default="Accessories"),
            "gender": node.findtext("gender"),
            "size": node.findtext("size"),
            "color": node.findtext("color"),
            "price": float(node.findtext("price", default="0")),
            "cost_price": float(node.findtext("cost_price", default="0")),
            "stock": int(node.findtext("stock", default="0")),
            "min_stock": int(node.findtext("min_stock", default="0")),
            "location": node.findtext("location"),
            "season_tag": node.findtext("season_tag", default="all-season"),
        }
        db.add(Product(sku=_next_sku(db), **payload))
        inserted += 1
    db.commit()
    return {"inserted": inserted}


@router.get("")
def list_products(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Product).order_by(Product.created_at.desc()).all()


@router.post("")
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    p = Product(sku=_next_sku(db), **payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    forecast_product(db, p.id, horizon=30)
    return p


# ─── Parameterized routes LAST ─────────────────────────────────────────────────

@router.put("/{product_id}")
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(p)
    db.commit()
    return {"deleted": True}
