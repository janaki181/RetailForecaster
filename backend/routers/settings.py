import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Setting
from schemas import SettingUpdate
from auth import require_admin, get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _setting_map(db: Session):
    return {s.key: s.value for s in db.query(Setting).all()}


@router.get("")
def get_settings(db: Session = Depends(get_db), _=Depends(get_current_user)):
    data = _setting_map(db)
    return {
        "store": {
            "currency": data.get("currency", "INR"),
            "timezone": data.get("timezone", "Asia/Kolkata"),
            "forecast_horizon": int(data.get("forecast_horizon", 30)),
        },
        "notifications": {
            "low_stock_alerts": data.get("low_stock_alerts", "true").lower() == "true",
            "daily_sales_summary": data.get("daily_sales_summary", "true").lower() == "true",
            "anomaly_alerts": data.get("anomaly_alerts", "true").lower() == "true",
        },
        "security": {
            "two_fa_required": data.get("two_fa_required", "true").lower() == "true",
            "session_timeout": int(data.get("session_timeout", 30)),
            "password_rotation_days": int(data.get("password_rotation_days", 90)),
        },
        "inventory": {
            "max_warehouse_capacity": int(data.get("max_warehouse_capacity", 50000)),
            "safety_buffer_days": int(data.get("safety_buffer_days", 7)),
        },
    }


@router.put("")
def put_settings(payload: SettingUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    s = db.query(Setting).filter(Setting.key == payload.key).first()
    if not s:
        s = Setting(key=payload.key, value=payload.value)
        db.add(s)
    else:
        s.value = payload.value
    db.commit()
    return {"key": payload.key, "value": payload.value}
