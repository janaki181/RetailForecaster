import random
from datetime import datetime, timedelta

from database import SessionLocal, engine
from models import Base, Product, Sale, User, Setting, InventoryLog
from auth import get_password_hash


PRODUCTS = [
    ("Denim Jeans", "Clothing", "all-season"),
    ("Basic T-Shirt", "Clothing", "all-season"),
    ("Classic Shirt", "Clothing", "all-season"),
    ("Black Leggings", "Clothing", "all-season"),
    ("Daily Sneakers", "Footwear", "all-season"),
    ("Woolen Jacket", "Clothing", "winter"),
    ("Thermal Wear Set", "Clothing", "winter"),
    ("Winter Boots", "Footwear", "winter"),
    ("Knit Sweater", "Clothing", "winter"),
    ("Cotton Kurti", "Clothing", "summer"),
    ("Linen Shorts", "Clothing", "summer"),
    ("Kids Summer Set", "Kids", "summer"),
    ("Open Sandals", "Footwear", "summer"),
    ("Ethnic Wear Set", "Clothing", "festive"),
    ("Formal Blazer", "Clothing", "festive"),
    ("Gift Accessory Box", "Accessories", "festive"),
    ("Party Heels", "Footwear", "festive"),
    ("Raincoat", "Clothing", "monsoon"),
    ("Waterproof Boots", "Footwear", "monsoon"),
    ("Indoor Slippers", "Home", "monsoon"),
]


def _season_factor(day: datetime, tag: str) -> float:
    month = day.month
    factor = 1.0
    if day.weekday() in [5, 6]:
        factor *= random.uniform(1.2, 1.3)

    if tag == "summer" and month in [4, 5, 6]:
        factor *= random.uniform(1.4, 1.8)
    if tag == "winter" and month in [10, 11, 12, 1, 2]:
        factor *= random.uniform(1.4, 1.9)
    if tag == "monsoon" and month in [7, 8, 9]:
        factor *= random.uniform(1.4, 1.8)
    if tag == "festive" and month in [10, 11, 12, 1]:
        factor *= random.uniform(1.6, 2.2)

    if month in [10, 11]:
        factor *= random.uniform(1.1, 1.4)
    if month == 12:
        factor *= random.uniform(1.1, 1.3)

    return factor


def run_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Product).count() > 0:
        db.close()
        return

    users = [
        User(name="Admin User", email="admin@retail.com", password_hash=get_password_hash("admin123"), role="Admin", status="Active"),
        User(name="Store Manager", email="manager@retail.com", password_hash=get_password_hash("manager123"), role="Store Manager", status="Active"),
        User(name="Sales Associate", email="sales@retail.com", password_hash=get_password_hash("sales123"), role="Sales Associate", status="Active"),
        User(name="Analyst", email="analyst@retail.com", password_hash=get_password_hash("analyst123"), role="Analyst", status="Active"),
    ]
    db.add_all(users)

    default_settings = {
        "currency": "INR",
        "timezone": "Asia/Kolkata",
        "forecast_horizon": "7",
        "max_warehouse_capacity": "50000",
        "safety_buffer_days": "7",
        "estimated_visitors_per_order": "20",
        "low_stock_alerts": "true",
        "daily_sales_summary": "true",
        "anomaly_alerts": "true",
        "two_fa_required": "true",
        "session_timeout": "30",
        "password_rotation_days": "90",
        "sessions_today": "200",
    }
    for k, v in default_settings.items():
        db.add(Setting(key=k, value=v))

    products = []
    for idx, (name, category, season_tag) in enumerate(PRODUCTS, start=1):
        p = Product(
            sku=f"SKU-{idx:04d}",
            name=name,
            category=category,
            gender=random.choice(["Men", "Women", "Kids", "Unisex"]),
            size=random.choice(["S", "M", "L", "XL", "One Size"]),
            color=random.choice(["Black", "Blue", "Red", "Green", "White", "Grey"]),
            price=round(random.uniform(499, 3999), 2),
            cost_price=round(random.uniform(250, 2500), 2),
            stock=random.randint(80, 220),
            min_stock=random.randint(20, 50),
            location=random.choice(["A1", "A2", "B1", "B2", "C1"]),
            season_tag=season_tag,
        )
        products.append(p)
        db.add(p)

    db.commit()

    channels = ["Online", "In-Store", "Marketplace"]
    statuses = ["Delivered", "Shipped", "Packed", "Processing"]
    customers = [
        "Aarav", "Vivaan", "Aditya", "Isha", "Diya", "Riya", "Aanya", "Kabir", "Arjun", "Meera", "Zoya", "Anaya"
    ]

    start_day = datetime.utcnow() - timedelta(days=180)
    for day_idx in range(180):
        d = start_day + timedelta(days=day_idx)
        for p in products:
            base = random.uniform(0.6, 2.3)
            qty = int(max(0, round(base * _season_factor(d, p.season_tag))))
            if qty == 0:
                continue
            revenue = qty * p.price
            s = Sale(
                product_id=p.id,
                customer_name=random.choice(customers),
                channel=random.choice(channels),
                quantity=qty,
                revenue=revenue,
                status=random.choice(statuses),
                sale_date=d,
            )
            p.stock = max(0, p.stock - qty)
            db.add(s)
            db.add(InventoryLog(product_id=p.id, change_qty=-qty, reason="Sale", timestamp=d))

            if p.stock < p.min_stock:
                restock = random.randint(50, 140)
                p.stock += restock
                db.add(InventoryLog(product_id=p.id, change_qty=restock, reason="Restock", timestamp=d))

    db.commit()
    db.close()


if __name__ == "__main__":
    run_seed()
