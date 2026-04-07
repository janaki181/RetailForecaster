from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(40), nullable=False, default="Sales Associate")
    status = Column(String(40), nullable=False, default="Active")
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    memberships = relationship("ShopMember", back_populates="user", cascade="all, delete-orphan")


class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("ShopMember", back_populates="shop", cascade="all, delete-orphan")


class ShopMember(Base):
    __tablename__ = "shop_members"
    __table_args__ = (
        UniqueConstraint("user_id", "shop_id", name="uq_user_shop_membership"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(40), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="memberships")
    shop = relationship("Shop", back_populates="members")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(80), nullable=False)
    gender = Column(String(40), nullable=True)
    size = Column(String(40), nullable=True)
    color = Column(String(40), nullable=True)
    price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    min_stock = Column(Integer, nullable=False, default=0)
    location = Column(String(120), nullable=True)
    season_tag = Column(String(40), nullable=False, default="all-season")
    created_at = Column(DateTime, default=datetime.utcnow)

    sales = relationship("Sale", back_populates="product", cascade="all, delete-orphan")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    customer_name = Column(String(255), nullable=False)
    channel = Column(String(40), nullable=False)
    quantity = Column(Integer, nullable=False)
    revenue = Column(Float, nullable=False)
    status = Column(String(40), nullable=False)
    sale_date = Column(DateTime, default=datetime.utcnow, index=True)

    product = relationship("Product", back_populates="sales")


class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    change_qty = Column(Integer, nullable=False)
    reason = Column(String(80), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    product = relationship("Product")


class DemandForecast(Base):
    __tablename__ = "demand_forecasts"
    __table_args__ = (
        UniqueConstraint("product_id", "forecast_date", name="uq_product_forecast_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    forecast_date = Column(Date, nullable=False, index=True)
    predicted_qty = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=True)
    model_type = Column(String(40), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SeasonalPattern(Base):
    __tablename__ = "seasonal_patterns"
    __table_args__ = (
        UniqueConstraint("product_id", "month", name="uq_product_month_pattern"),
    )

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    month = Column(Integer, nullable=False)
    season_label = Column(String(40), nullable=False)
    avg_sales_multiplier = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ReorderOrder(Base):
    __tablename__ = "reorder_orders"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    recommended_qty = Column(Integer, nullable=False)
    current_stock = Column(Integer, nullable=False)
    predicted_demand_30d = Column(Float, nullable=False)
    confidence = Column(Float, nullable=True)
    status = Column(String(40), nullable=False, default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product")


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(120), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)


class ActivityNote(Base):
    __tablename__ = "activity_notes"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    author = relationship("User")
