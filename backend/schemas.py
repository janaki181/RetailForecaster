from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    status: str = "Active"


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserInvite(BaseModel):
    name: str
    email: EmailStr
    role: str


class UserOut(UserBase):
    id: int
    last_seen: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    category: str
    gender: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    price: float
    cost_price: float
    stock: int
    min_stock: int
    location: Optional[str] = None
    season_tag: str


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    stock: Optional[int] = None
    min_stock: Optional[int] = None
    location: Optional[str] = None
    season_tag: Optional[str] = None


class ProductOut(ProductBase):
    id: int
    sku: str
    created_at: datetime

    class Config:
        from_attributes = True


class SaleCreate(BaseModel):
    product_id: int
    customer_name: str
    channel: str
    quantity: int
    status: str


class SaleOut(BaseModel):
    id: int
    product_id: int
    customer_name: str
    channel: str
    quantity: int
    revenue: float
    status: str
    sale_date: datetime

    class Config:
        from_attributes = True


class InventoryAdjust(BaseModel):
    product_id: int
    change_qty: int
    reason: str


class InventoryLogOut(BaseModel):
    id: int
    product_id: int
    change_qty: int
    reason: str
    timestamp: datetime

    class Config:
        from_attributes = True


class SettingUpdate(BaseModel):
    key: str
    value: str


class SettingOut(BaseModel):
    key: str
    value: str

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    today_revenue: float
    today_revenue_change_pct: Optional[float]
    units_sold_today: int
    units_sold_change_pct: Optional[float]
    low_stock_items: int
    monthly_revenue: float
    monthly_revenue_change_pct: Optional[float]
